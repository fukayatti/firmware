import { useRef, useCallback } from 'react'

// Exact UUIDs from BLESerialService.cpp
const SERVICE_UUID = '4371ec0b-3d43-49f9-b731-7c72a4a7bb91'
const CHAR_UUID    = 'd555ed97-bf2a-4f46-b3eb-d1fcdd7325e9' // READ | NOTIFY | WRITE

const CONNECT_RETRIES = 3
const RETRY_DELAY_MS  = 1500

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export function useBle(
  onData: (line: string) => void,
  onConnect: (name: string) => void,
  onDisconnect: () => void,
  onError: (msg: string) => void,
) {
  const deviceRef = useRef<BluetoothDevice | null>(null)
  const charRef   = useRef<BluetoothRemoteGATTCharacteristic | null>(null)
  const bufferRef = useRef('')

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
      // Use acceptAllDevices + optionalServices so the chooser shows
      // every nearby device regardless of what services it advertises.
      // This avoids the "No Services matching UUID" filter rejection while
      // still giving us permission to access the service once connected.
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID],
      })
      deviceRef.current = device
      device.addEventListener('gattserverdisconnected', () => {
        charRef.current = null
        onDisconnect()
      })

      // Retry GATT connect – the first attempt often fails on Web Bluetooth
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

      await char.startNotifications()
      char.addEventListener('characteristicvaluechanged', handleNotify)

      onConnect(device.name ?? 'Bruce')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      // Don't surface "user cancelled" as an error
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
    if (!charRef.current) {
      onError('Not connected – cannot send command')
      return
    }
    try {
      const data = new TextEncoder().encode(cmd + '\n')
      // Chunk into 20-byte pieces (safe BLE MTU floor)
      for (let i = 0; i < data.length; i += 20) {
        await charRef.current.writeValueWithoutResponse(data.slice(i, i + 20))
      }
    } catch (e: unknown) {
      onError(`Send failed: ${e instanceof Error ? e.message : e}`)
    }
  }, [onError])

  return { connect, disconnect, send }
}
