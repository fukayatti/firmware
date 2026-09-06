import { useState, useEffect, useRef } from 'react'
import { Key, Plus, Trash2, Wifi, QrCode, Copy, Check, AlertCircle, Loader2, Scan } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner'
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner'
import clsx from 'clsx'
import type { LogEntry } from '../types'

interface Props {
  logs: LogEntry[]
  onCommand: (cmd: string) => void
  connected: boolean
}

interface TotpEntry {
  index: number
  name: string
  period: number
  digits: number
  code: string
  seconds_left: number
}

function CodeCard({ entry, onDelete, onCopy }: {
  entry: TotpEntry
  onDelete: (i: number) => void
  onCopy: (code: string) => void
}) {
  const pct = (entry.seconds_left / entry.period) * 100
  const urgent = entry.seconds_left <= 5
  const mid = entry.seconds_left <= 10

  return (
    <div className="glass-bright border border-[var(--color-border-bright)] rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/30 flex items-center justify-center shrink-0">
            <Key size={14} className="text-[var(--color-cyan)]" />
          </div>
          <p className="font-bold text-sm text-[var(--color-text)] truncate">{entry.name}</p>
        </div>
        <button
          onClick={() => onDelete(entry.index)}
          className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* OTP Code */}
      <div className="flex items-center justify-between gap-3">
        <p className={clsx(
          'font-black text-3xl tracking-[0.2em] font-mono transition-colors',
          urgent ? 'text-[var(--color-danger)]'
          : mid   ? 'text-[var(--color-warning)]'
          :         'text-[var(--color-text)]'
        )}>
          {entry.code.length === 6
            ? `${entry.code.slice(0,3)} ${entry.code.slice(3)}`
            : entry.code}
        </p>
        <button
          onClick={() => onCopy(entry.code)}
          className="p-2 rounded-xl glass-bright border border-[var(--color-border-bright)] text-[var(--color-muted)] hover:text-[var(--color-neon)] transition-colors"
        >
          <Copy size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1.5 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all duration-1000', urgent ? 'bg-[var(--color-danger)]' : mid ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-neon)]')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-[var(--color-muted)] text-right">{entry.seconds_left}s</p>
      </div>
    </div>
  )
}

export function TotpTab({ logs, onCommand, connected }: Props) {
  const [entries, setEntries]       = useState<TotpEntry[]>([])
  const [loading, setLoading]       = useState(false)
  const [copied, setCopied]         = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [addMode, setAddMode]       = useState<'manual' | 'uri' | 'scan'>('manual')
  const [name, setName]             = useState('')
  const [secret, setSecret]         = useState('')
  const [uri, setUri]               = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Listen for TOTP_JSON: lines in logs
  useEffect(() => {
    // Look from the end backwards to find the latest TOTP_JSON
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].text.startsWith('TOTP_JSON:')) {
        try {
          const jsonStr = logs[i].text.slice(10)
          const data: TotpEntry[] = JSON.parse(jsonStr)
          setEntries(data)
        } catch (e) {
          console.error('Failed to parse TOTP JSON', e)
        }
        break
      }
    }
  }, [logs])

  // Poll via BLE command every 1 second if connected
  useEffect(() => {
    if (!connected) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    
    // Initial fetch
    onCommand('totp list')
    
    intervalRef.current = setInterval(() => {
      onCommand('totp list')
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [connected, onCommand])

  const handleAdd = () => {
    setLoading(true)
    if (addMode === 'uri') {
      onCommand(`totp add_uri "${uri}"`)
    } else {
      const cleanSecret = secret.toUpperCase().replace(/\s/g, '')
      onCommand(`totp add "${name}" "${cleanSecret}"`)
    }
    
    // Reset form after short delay
    setTimeout(() => {
      setName('')
      setSecret('')
      setUri('')
      setShowAdd(false)
      setLoading(false)
      onCommand('totp list')
    }, 1000)
  }

  const handleDelete = (index: number) => {
    onCommand(`totp delete ${index}`)
    setTimeout(() => onCommand('totp list'), 500)
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code)
      setTimeout(() => setCopied(''), 2000)
    })
  }

  if (!connected) {
    return (
      <div className="animate-fade-in-up text-center py-12 space-y-3">
        <AlertCircle size={36} className="mx-auto text-[var(--color-danger)]" />
        <p className="font-bold text-[var(--color-danger)]">未接続</p>
        <p className="text-[var(--color-muted)] text-sm">BLE接続が必要です</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/30 flex items-center justify-center">
          <Key size={18} className="text-[var(--color-cyan)]" />
        </div>
        <div>
          <p className="font-bold text-sm text-[var(--color-cyan)]">TOTP Authenticator</p>
          <p className="text-[10px] text-[var(--color-muted)]">BLE経由で管理 (WiFi不要)</p>
        </div>
      </div>

      {/* Copied toast */}
      {copied && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-neon-dim)] border border-[var(--color-neon)]/30">
          <Check size={14} className="text-[var(--color-neon)]" />
          <p className="text-xs text-[var(--color-neon)]">コードをコピーしました: {copied}</p>
        </div>
      )}

      {/* Account list */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map(e => (
            <CodeCard key={e.index} entry={e} onDelete={handleDelete} onCopy={handleCopy} />
          ))}
        </div>
      )}

      {entries.length === 0 && !showAdd && (
        <p className="text-center text-[var(--color-muted)] text-sm py-6">
          アカウントが登録されていません
        </p>
      )}

      {/* Add account */}
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm
            bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/40 text-[var(--color-cyan)]
            hover:bg-[var(--color-cyan)]/20 transition-all active:scale-[0.98]"
        >
          <Plus size={16} /> アカウントを追加
        </button>
      ) : (
        <div className="glass-bright border border-[var(--color-border-bright)] rounded-xl p-4 space-y-3">
          <p className="font-bold text-sm text-[var(--color-cyan)]">アカウントを追加</p>

          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-[var(--color-border-bright)]">
            {(['manual', 'uri', 'scan'] as const).map(m => (
              <button
                key={m}
                onClick={() => setAddMode(m)}
                className={clsx('flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold transition-colors',
                  addMode === m
                    ? 'bg-[var(--color-cyan)]/20 text-[var(--color-cyan)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                )}
              >
                {m === 'manual' ? <Key size={11} /> : m === 'uri' ? <QrCode size={11} /> : <Scan size={11} />}
                {m === 'manual' ? '手動入力' : m === 'uri' ? 'URI入力' : 'QR読取'}
              </button>
            ))}
          </div>

          {addMode === 'scan' && (
            <div className="w-full aspect-square max-h-64 mx-auto rounded-xl overflow-hidden relative bg-black">
              <Scanner
                onScan={(result: IDetectedBarcode[]) => {
                  if (result && result.length > 0) {
                    const scanned = result[0].rawValue
                    if (scanned.startsWith('otpauth://')) {
                      setUri(scanned)
                      setAddMode('uri') // switch to URI mode to review and submit
                    }
                  }
                }}
                formats={['qr_code']}
              />
            </div>
          )}

          {addMode === 'manual' && (
            <>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="アカウント名 (例: GitHub)"
                className="w-full bg-[var(--color-surface-3)] border border-[var(--color-border-bright)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-cyan)]/60"
              />
              <input
                type="text"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="Base32 シークレット (JBSWY3DPEHPK3PXP)"
                className="w-full bg-[var(--color-surface-3)] border border-[var(--color-border-bright)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-cyan)]/60"
              />
            </>
          )}

          {addMode === 'uri' && (
            <input
              type="text"
              value={uri}
              onChange={e => setUri(e.target.value)}
              placeholder="otpauth://totp/GitHub:user@example.com?secret=..."
              className="w-full bg-[var(--color-surface-3)] border border-[var(--color-border-bright)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-cyan)]/60"
            />
          )}

          {addMode !== 'scan' && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2 rounded-lg text-sm text-[var(--color-muted)] border border-[var(--color-border-bright)] hover:text-[var(--color-text)] transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleAdd}
                disabled={loading || (addMode === 'manual' ? !secret : !uri)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold
                  bg-[var(--color-cyan)]/20 border border-[var(--color-cyan)]/50 text-[var(--color-cyan)]
                  disabled:opacity-40 hover:bg-[var(--color-cyan)]/30 transition-colors"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                追加
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
