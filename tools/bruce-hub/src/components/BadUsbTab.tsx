import { useState, useRef } from 'react'
import { Play, Save, TerminalSquare, AlertCircle, FileText } from 'lucide-react'
import clsx from 'clsx'
import type { LogEntry } from '../types'

interface Props {
  logs: LogEntry[]
  onCommand: (cmd: string) => Promise<void>
  connected: boolean
}

const DEFAULT_SCRIPT = `REM 挿入後の認識待ち（2秒）
DELAY 2000

REM PIN入力
STRING 200903
DELAY 300

REM 確定Enter
ENTER`

export function BadUsbTab({ logs, onCommand, connected }: Props) {
  const [script, setScript] = useState(DEFAULT_SCRIPT)
  const [filename, setFilename] = useState('/payload.txt')
  const [loading, setLoading] = useState(false)

  const handleRun = async () => {
    if (!script.trim()) return
    setLoading(true)
    
    // Split script into lines and send them
    await onCommand('badusb run_from_buffer')
    const lines = script.split('\\n')
    for (const line of lines) {
      await onCommand(line)
    }
    await onCommand('EOF')
    
    setLoading(false)
  }

  const handleSave = async () => {
    if (!script.trim() || !filename.trim()) return
    setLoading(true)
    
    // Estimate size for storage write
    const size = new Blob([script]).size + 100
    await onCommand(`storage write ${filename} ${size}`)
    
    const lines = script.split('\\n')
    for (const line of lines) {
      await onCommand(line)
    }
    await onCommand('EOF')
    
    setLoading(false)
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
    <div className="animate-fade-in-up flex flex-col h-full space-y-4">
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-neon)]/10 border border-[var(--color-neon)]/30 flex items-center justify-center">
          <TerminalSquare size={18} className="text-[var(--color-neon)]" />
        </div>
        <div>
          <p className="font-bold text-sm text-[var(--color-neon)]">BadUSB (Ducky Script)</p>
          <p className="text-[10px] text-[var(--color-muted)]">直接実行、またはデバイスに保存</p>
        </div>
      </div>

      <div className="flex-1 min-h-[200px] flex flex-col relative glass-bright border border-[var(--color-border-bright)] rounded-2xl overflow-hidden focus-within:border-[var(--color-neon)]/50 transition-colors">
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-surface-2)] border-b border-[var(--color-border-bright)]">
          <span className="text-xs font-bold text-[var(--color-muted)]">Script</span>
        </div>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="REM Your Ducky Script here..."
          className="flex-1 w-full bg-transparent p-4 font-mono text-xs text-[var(--color-text)] resize-none focus:outline-none"
          spellCheck={false}
        />
      </div>

      <div className="shrink-0 flex flex-col gap-3">
        <button
          onClick={handleRun}
          disabled={loading || !script.trim()}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm
            bg-[var(--color-neon)]/10 border border-[var(--color-neon)]/40 text-[var(--color-neon)]
            hover:bg-[var(--color-neon)]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          <Play size={16} />
          {loading ? '送信中...' : '今すぐ実行 (Run Now)'}
        </button>

        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border-bright)] rounded-xl focus-within:border-[var(--color-cyan)]/50 transition-colors">
            <FileText size={14} className="text-[var(--color-muted)]" />
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="/payload.txt"
              className="flex-1 bg-transparent text-sm text-[var(--color-text)] focus:outline-none"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={loading || !script.trim() || !filename.trim()}
            className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm
              bg-[var(--color-surface-2)] border border-[var(--color-border-bright)] text-[var(--color-text)]
              hover:bg-[var(--color-surface-3)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            <Save size={16} />
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
