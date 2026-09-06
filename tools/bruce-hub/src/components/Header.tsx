import { Bluetooth, BluetoothOff, Battery, BatteryLow, Signal } from 'lucide-react'
import type { BleState } from '../types'
import clsx from 'clsx'

interface Props {
  ble: BleState
  onConnect: () => void
  onDisconnect: () => void
}

export function Header({ ble, onConnect, onDisconnect }: Props) {
  const BattIcon = ble.battery !== null && ble.battery < 20 ? BatteryLow : Battery
  const battColor = ble.battery === null
    ? 'text-[var(--color-muted)]'
    : ble.battery < 20
      ? 'text-[var(--color-danger)]'
      : 'text-[var(--color-neon)]'

  return (
    <header className="sticky top-0 z-50 glass border-b border-[var(--color-border)] px-4 py-3">
      <div className="flex items-center justify-between gap-3 max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-neon-dim)] border border-[var(--color-neon)]/40 flex items-center justify-center">
            <span className="text-neon font-black text-sm leading-none">B</span>
          </div>
          <div>
            <p className="text-neon font-black text-base leading-tight tracking-wider">BRUCE</p>
            <p className="text-[var(--color-muted)] text-[10px] leading-none tracking-widest uppercase">Hub</p>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {ble.connected && ble.battery !== null && (
            <div className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-bright text-xs font-semibold', battColor)}>
              <BattIcon size={13} />
              <span>{ble.battery}%</span>
            </div>
          )}
          {ble.connected && ble.rssi !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-bright text-xs font-semibold text-[var(--color-cyan)]">
              <Signal size={13} />
              <span>{ble.rssi} dBm</span>
            </div>
          )}
          <button
            onClick={ble.connected ? onDisconnect : onConnect}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200',
              ble.connected
                ? 'bg-[var(--color-neon-dim)] border border-[var(--color-neon)]/50 text-neon hover:bg-[var(--color-neon)]/20'
                : 'bg-[var(--color-surface-3)] border border-[var(--color-border-bright)] text-[var(--color-muted)] hover:border-[var(--color-neon)]/40 hover:text-[var(--color-neon)]'
            )}
          >
            {ble.connected
              ? <><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-neon)] animate-pulse-neon" /><Bluetooth size={12} />{ble.deviceName}</>
              : <><BluetoothOff size={12} />Connect BLE</>
            }
          </button>
        </div>
      </div>
    </header>
  )
}
