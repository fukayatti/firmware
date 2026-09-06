import { useRef, useEffect, useState, useCallback } from 'react'
import { Terminal, Send, Trash2, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import type { LogEntry } from '../types'

interface Props {
  logs: LogEntry[]
  onSend: (cmd: string) => void
  onClear: () => void
  connected: boolean
}

const LEVEL_CLASS: Record<LogEntry['level'], string> = {
  info: 'terminal-line-info',
  ok: 'terminal-line-ok',
  err: 'terminal-line-err',
  warn: 'terminal-line-warn',
  dim: 'terminal-line-dim',
}

const HISTORY_LIMIT = 50

export function TerminalTab({ logs, onSend, onClear, connected }: Props) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleSend = useCallback(() => {
    const cmd = input.trim()
    if (!cmd) return
    onSend(cmd)
    setHistory(h => [cmd, ...h].slice(0, HISTORY_LIMIT))
    setHistIdx(-1)
    setInput('')
  }, [input, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { handleSend(); return }
    if (e.key === 'ArrowUp') {
      const idx = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(idx)
      setInput(history[idx] ?? '')
      e.preventDefault()
    }
    if (e.key === 'ArrowDown') {
      const idx = Math.max(histIdx - 1, -1)
      setHistIdx(idx)
      setInput(idx === -1 ? '' : history[idx])
      e.preventDefault()
    }
  }

  const QUICK_CMDS = [
    { label: 'reboot',  cmd: 'reboot'    },
    { label: 'free',    cmd: 'free'      },
    { label: 'info',    cmd: 'info'      },
    { label: 'ls /',    cmd: 'ls /'      },
    { label: 'uptime',  cmd: 'uptime'    },
    { label: 'date',    cmd: 'date'      },
    { label: 'help',    cmd: 'help'      },
    { label: 'wifi',    cmd: 'wifi scan' },
  ]

  return (
    <div className="animate-fade-in-up flex flex-col gap-4 h-full">
      {/* Quick commands */}
      <div className="flex gap-1.5 flex-wrap">
        {QUICK_CMDS.map(q => (
          <button
            key={q.cmd}
            onClick={() => onSend(q.cmd)}
            disabled={!connected}
            className="px-2.5 py-1 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-muted)] font-mono text-xs hover:border-[var(--color-cyan)]/50 hover:text-[var(--color-cyan)] transition-all disabled:opacity-30 active:scale-95"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Log window */}
      <div
        className="flex-1 glass-bright rounded-xl border border-[var(--color-border-bright)] overflow-hidden flex flex-col"
        style={{ minHeight: '300px', maxHeight: '55vh' }}
      >
        {/* Terminal title bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-3)]/50">
          <div className="flex items-center gap-2">
            <Terminal size={13} className="text-[var(--color-neon)]" />
            <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest">Serial Console</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[var(--color-muted)]">{logs.length} lines</span>
            <button onClick={onClear} className="text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Log content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-0.5 terminal-text">
          {logs.length === 0 && (
            <p className="terminal-line-dim text-center py-8">No output yet. Connect to Bruce and send a command.</p>
          )}
          {logs.map(log => (
            <div key={log.id} className={clsx('flex gap-2 animate-slide-in', LEVEL_CLASS[log.level])}>
              <span className="terminal-line-dim shrink-0 select-none">{log.ts}</span>
              <span className="break-all">{log.text}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className={clsx(
        'flex items-center gap-2 px-3 py-2 glass-bright rounded-xl border transition-colors',
        connected ? 'border-[var(--color-border-bright)] focus-within:border-[var(--color-neon)]/50' : 'border-[var(--color-border)] opacity-50'
      )}>
        <ChevronRight size={14} className="text-neon shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={connected ? 'Enter command… (↑↓ history)' : 'Connect BLE to use terminal'}
          disabled={!connected}
          spellCheck={false}
          className="flex-1 bg-transparent text-sm font-mono text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!connected || !input.trim()}
          className="p-1.5 rounded-lg bg-[var(--color-neon-dim)] text-neon disabled:opacity-30 hover:bg-[var(--color-neon)]/20 transition-all active:scale-90"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
