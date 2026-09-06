import { useState } from 'react'
import { Wifi, Globe, Shield, RefreshCw, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  onCommand: (cmd: string) => void
  connected: boolean
}

interface SettingRow {
  id: string
  icon: React.ElementType
  label: string
  description: string
  cmd: string
  color: string
}

const SETTINGS: SettingRow[] = [
  { id: 'wifi-scan', icon: Wifi, label: 'Wi-Fi Scan', description: 'Scan nearby access points', cmd: 'wifi scan', color: 'text-[var(--color-cyan)]' },
  { id: 'wifi-atk', icon: Shield, label: 'Wi-Fi Attack', description: 'Deauth / Evil twin', cmd: 'wifi attack', color: 'text-[var(--color-danger)]' },
  { id: 'web-ui', icon: Globe, label: 'Web UI (WebBLE)', description: 'Open BLE API control page', cmd: 'ble webui', color: 'text-[var(--color-neon)]' },
  { id: 'reboot', icon: RefreshCw, label: 'Reboot Device', description: 'Soft reset Bruce', cmd: 'reboot', color: 'text-[var(--color-warning)]' },
]

export function SettingsTab({ onCommand, connected }: Props) {
  const [lastRun, setLastRun] = useState<string | null>(null)

  const run = (row: SettingRow) => {
    onCommand(row.cmd)
    setLastRun(row.id)
    setTimeout(() => setLastRun(null), 1500)
  }

  return (
    <div className="animate-fade-in-up space-y-2">
      <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-3">Device Actions</p>
      {SETTINGS.map(row => {
        const Icon = row.icon
        return (
          <button
            key={row.id}
            onClick={() => run(row)}
            disabled={!connected}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl glass-bright border transition-all duration-150 text-left',
              lastRun === row.id
                ? 'border-[var(--color-neon)]/50 bg-[var(--color-neon-dim)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-bright)] active:scale-[0.98]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-surface-3)] border border-[var(--color-border-bright)]', row.color)}>
              <Icon size={18} />
            </div>
            <div className="flex-1">
              <p className={clsx('font-semibold text-sm', row.color)}>{row.label}</p>
              <p className="text-[var(--color-muted)] text-xs">{row.description}</p>
            </div>
            <ChevronRight size={16} className="text-[var(--color-muted)]" />
          </button>
        )
      })}
    </div>
  )
}
