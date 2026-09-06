import { useState } from 'react'
import { Radio, Zap, Usb, HardDrive, Key, ChevronRight, Play, Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  onCommand: (cmd: string) => void
  connected: boolean
}

interface Module {
  id: string
  label: string
  description: string
  icon: React.ElementType
  color: string
  actions: { label: string; cmd: string; icon?: React.ElementType }[]
}

const MODULES: Module[] = [
  {
    id: 'ir',
    label: 'IR',
    description: 'Infrared transmitter / receiver',
    icon: Radio,
    color: 'text-[var(--color-warning)]',
    actions: [
      { label: 'Receive',   cmd: 'ir rx'           },
      { label: 'Send file', cmd: 'ir tx_from_file'  },
      { label: 'List saved',cmd: 'ls /IR'           },
    ],
  },
  {
    id: 'rf',
    label: 'RF 433',
    description: '433 MHz RF transmitter',
    icon: Zap,
    color: 'text-[var(--color-purple)]',
    actions: [
      { label: 'Receive',   cmd: 'rf rx'            },
      { label: 'Transmit',  cmd: 'rf tx'            },
      { label: 'Scan',      cmd: 'rf scan'          },
    ],
  },
  {
    id: 'badusb',
    label: 'BadUSB',
    description: 'USB HID scripting via DuckyScript',
    icon: Usb,
    color: 'text-[var(--color-danger)]',
    actions: [
      { label: 'List scripts',    cmd: 'ls /BadUSB'               },
      { label: 'Run from buffer', cmd: 'badusb run_from_buffer'   },
    ],
  },
  {
    id: 'totp',
    label: 'TOTP',
    description: 'Time-based OTP authenticator',
    icon: Key,
    color: 'text-[var(--color-cyan)]',
    actions: [
      { label: 'Open TOTP App',    cmd: 'loader open TOTP Auth'   },
      { label: 'List accounts',    cmd: 'cat /totp_accounts.json' },
      { label: 'List apps',        cmd: 'loader list'             },
    ],
  },
  {
    id: 'storage',
    label: 'Storage',
    description: 'Flash filesystem browser',
    icon: HardDrive,
    color: 'text-[var(--color-neon)]',
    actions: [
      { label: 'List root', cmd: 'ls /'    },
      { label: 'Free RAM',  cmd: 'free'    },
      { label: 'Device info', cmd: 'info'  },
    ],
  },
]

export function ModulesTab({ onCommand, connected }: Props) {
  const [active, setActive] = useState<string | null>(null)
  const [running, setRunning] = useState<string | null>(null)

  const run = (cmd: string, id: string) => {
    setRunning(id + cmd)
    onCommand(cmd)
    setTimeout(() => setRunning(null), 800)
  }

  return (
    <div className="animate-fade-in-up space-y-3">
      {MODULES.map(mod => {
        const Icon = mod.icon
        const isOpen = active === mod.id
        return (
          <div
            key={mod.id}
            className={clsx(
              'glass-bright rounded-2xl border overflow-hidden transition-all duration-200',
              isOpen ? 'border-[var(--color-border-bright)]' : 'border-[var(--color-border)]'
            )}
          >
            {/* Header row */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              onClick={() => setActive(isOpen ? null : mod.id)}
            >
              <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-surface-3)] border border-[var(--color-border-bright)]', mod.color)}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx('font-bold text-sm', mod.color)}>{mod.label}</p>
                <p className="text-[var(--color-muted)] text-xs truncate">{mod.description}</p>
              </div>
              <ChevronRight
                size={16}
                className={clsx('text-[var(--color-muted)] transition-transform duration-200', isOpen && 'rotate-90')}
              />
            </button>

            {/* Expanded actions */}
            {isOpen && (
              <div className="border-t border-[var(--color-border)] px-4 py-3 space-y-2 animate-fade-in-up">
                {mod.actions.map(action => {
                  const key = mod.id + action.cmd
                  const isRunning = running === key
                  return (
                    <button
                      key={action.cmd}
                      onClick={() => run(action.cmd, mod.id)}
                      disabled={!connected || isRunning}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                        'bg-[var(--color-surface-3)] border border-[var(--color-border)] transition-all duration-150',
                        'hover:border-[var(--color-border-bright)] hover:bg-[var(--color-surface-2)] active:scale-[0.98]',
                        'disabled:opacity-40 disabled:cursor-not-allowed',
                        mod.color,
                      )}
                    >
                      {isRunning
                        ? <Loader2 size={15} className="animate-spin" />
                        : <Play size={15} />
                      }
                      {action.label}
                      <code className="ml-auto text-[10px] font-mono text-[var(--color-muted)] bg-[var(--color-surface)] px-1.5 py-0.5 rounded">
                        {action.cmd}
                      </code>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
