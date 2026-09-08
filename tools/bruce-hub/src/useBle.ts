import { useRef, useCallback } from 'react'

// Exact UUIDs from BLESerialService.cpp
const SERVICE_UUID = '4371ec0b-3d43-49f9-b731-7c72a4a7bb91'
const CHAR_UUID    = 'd555ed97-bf2a-4f46-b3eb-d1fcdd7325e9' // READ | NOTIFY | WRITE

const CONNECT_RETRIES = 3
const RETRY_DELAY_MS  = 1500

// Bruce characteristic is WRITE (with response), not WRITE_NR.
// writeValueWithoutResponse fails on iOS/Bluefy because Core Bluetooth
// only allows it for characteristics with the Write-Without-Response property.
// writeValue (with response) works on all platforms.
const CHUNK_SIZE = 20 // Safe BLE ATT payload floor (MTU 23 − 3 header bytes)

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export function useBle(
  onData: (line: string) => void,
  onConnect: (name: string) => void,
  onDisconnect: () => void,
  onError: (msg: string) => void,
) {
  const deviceRef  = useRef<BluetoothDevice | null>(null)
  const charRef    = useRef<BluetoothRemoteGATTCharacteristic | null>(null)
  const bufferRef  = useRef('')
  // Track whether the char supports write-without-response (desktop Chrome)
  // so we can fall back to writeValue on iOS/Bluefy.
  const useWNRRef  = useRef(false)
  const sendQueue  = useRef<Promise<void>>(Promise.resolve())

  const handleNotify = useCallback((event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value!
    const text = new TextDecoder().decode(value)
    bufferRef.current += text
    const lines = bufferRef.current.split('\n')
    bufferRef.current = lines.pop() ?? ''
    lines.forEach(l => l.trim() && onData(l.trim()))
  }, [onData])

  const connect = useCallback(async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID],
      })
      deviceRef.current = device
      device.addEventListener('gattserverdisconnected', () => {
        charRef.current = null
        onDisconnect()
      })

      // Retry GATT connect – first attempt often fails on Web Bluetooth
      let server: BluetoothRemoteGATTServer | null = null
      for (let attempt = 1; attempt <= CONNECT_RETRIES; attempt++) {
        try {
          server = await device.gatt!.connect()
          break
        } catch (e) {
          if (attempt === CONNECT_RETRIES) throw e
          onError(`GATT connect attempt ${attempt} failed, retrying…`)
          await sleep(RETRY_DELAY_MS)
        }
      }
      if (!server) throw new Error('GATT server unavailable')

      let service: BluetoothRemoteGATTService
      try {
        service = await server.getPrimaryService(SERVICE_UUID)
      } catch {
        throw new Error(
          'BLE Serial service not found.\n' +
          '→ On Bruce: BLE menu → "Web BLE API" を選択してください。'
        )
      }

      const char = await service.getCharacteristic(CHAR_UUID)
      charRef.current = char

      // Check if write-without-response is available (desktop Chrome)
      // Properties is a bitmask: bit 2 = writeWithoutResponse, bit 3 = write
      useWNRRef.current = char.properties.writeWithoutResponse

      await char.startNotifications()
      char.addEventListener('characteristicvaluechanged', handleNotify)

      onConnect(device.name ?? 'Bruce')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!msg.includes('cancelled') && !msg.includes('cancel')) {
        onError(msg)
      }
    }
  }, [handleNotify, onConnect, onDisconnect, onError])

  const disconnect = useCallback(() => {
    deviceRef.current?.gatt?.disconnect()
    charRef.current = null
  }, [])

  const send = useCallback(async (cmd: string) => {
    const char = charRef.current
    if (!char) {
      onError('Not connected – cannot send command')
      return
    }
    
    // Serialize write operations to prevent "GATT operation already in progress"
    sendQueue.current = sendQueue.current.then(async () => {
      try {
        const data = new TextEncoder().encode(cmd + '\n')
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          const chunk = data.slice(i, i + CHUNK_SIZE)
          if (useWNRRef.current) {
            // Fast path: no acknowledgment needed (desktop Chrome)
            await char.writeValueWithoutResponse(chunk)
          } else {
            // Compatible path: waits for ACK — works on iOS/Bluefy too
            await char.writeValue(chunk)
          }
        }
      } catch (e: unknown) {
        onError(`Send failed: ${e instanceof Error ? e.message : e}`)
      }
    })
    
    return sendQueue.current
  }, [onError])

  return { connect, disconnect, send }
}
