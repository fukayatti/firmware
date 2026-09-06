// Types only – BLE UUIDs are defined in useBle.ts
export type LogLevel = 'info' | 'ok' | 'err' | 'warn' | 'dim'
export interface LogEntry {
  id: string   // crypto.randomUUID() — always unique
  ts: string
  level: LogLevel
  text: string
}

export interface BleState {
  connected: boolean
  deviceName: string | null
  battery: number | null
  rssi: number | null
}
