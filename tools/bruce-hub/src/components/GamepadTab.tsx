import { useEffect, useState, useCallback } from 'react'
import {
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Circle, X,
  RotateCcw, Play, Volume2, VolumeX,
  Keyboard
} from 'lucide-react'
import clsx from 'clsx'

interface Props {
  onCommand: (cmd: string) => void
  connected: boolean
}

type DpadKey = 'up' | 'down' | 'left' | 'right' | 'ok' | 'back'
const KEY_MAP: Record<string, DpadKey> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  Enter: 'ok', Escape: 'back',
}
const CMD_MAP: Record<DpadKey, string> = {
  up:    'nav up',
  down:  'nav down',
  left:  'nav prev',
  right: 'nav next',
  ok:    'nav select',
  back:  'nav esc',
}

function DPadButton({ label, icon: Icon, keyId, pressed, onPress, onRelease, className = '' }: {
  label: string, icon: React.ElementType, keyId: DpadKey,
  pressed: boolean, onPress: (k: DpadKey) => void, onRelease: (k: DpadKey) => void, className?: string
}) {
  return (
    <button
      aria-label={label}
      onPointerDown={() => onPress(keyId)}
      onPointerUp={() => onRelease(keyId)}
      onPointerLeave={() => onRelease(keyId)}
      className={clsx(
        'dpad-btn flex items-center justify-center rounded-xl glass-bright border border-[var(--color-border-bright)]',
        'w-14 h-14 text-[var(--color-muted)] select-none touch-none',
        pressed && 'pressed',
        className,
      )}
    >
      <Icon size={22} />
    </button>
  )
}

export function GamepadTab({ onCommand, connected }: Props) {
  const [pressed, setPressed] = useState<Set<DpadKey>>(new Set())
  const [kbMode, setKbMode] = useState(false)
  const [kbText, setKbText] = useState('')

  const press = useCallback((k: DpadKey) => {
    setPressed(p => new Set(p).add(k))
    onCommand(CMD_MAP[k])
  }, [onCommand])

  const release = useCallback((k: DpadKey) => {
    setPressed(p => { const n = new Set(p); n.delete(k); return n })
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (kbMode) return
      const k = KEY_MAP[e.key]
      if (k && !pressed.has(k)) press(k)
    }
    const up = (e: KeyboardEvent) => {
      if (kbMode) return
      const k = KEY_MAP[e.key]
      if (k) release(k)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [kbMode, pressed, press, release])

  const sendKb = () => {
    if (kbText.trim()) { onCommand(`kb ${kbText}`); setKbText('') }
  }

  const actionBtn = (label: string, icon: React.ElementType, cmd: string, color: string) => {
    const Icon = icon as any
    return (
      <button
        key={label}
        onClick={() => onCommand(cmd)}
        className={clsx(
          'flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl glass-bright border border-[var(--color-border-bright)]',
          'text-[9px] font-bold tracking-widest uppercase transition-all duration-150 active:scale-95',
          color,
        )}
      >
        <Icon size={16} />
        {label}
      </button>
    )
  }

  return (
    <div className="animate-fade-in-up space-y-5">
      {/* D-Pad */}
      <div className="border-gradient p-4 rounded-2xl">
        <div className="bg-[var(--color-surface-2)]/60 rounded-xl p-5">
          <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-4 text-center">Navigation</p>
          <div className="grid grid-cols-3 gap-2 w-fit mx-auto">
            <div />
            <DPadButton label="Up" icon={ArrowUp} keyId="up" pressed={pressed.has('up')} onPress={press} onRelease={release} />
            <div />
            <DPadButton label="Left" icon={ArrowLeft} keyId="left" pressed={pressed.has('left')} onPress={press} onRelease={release} />
            <button
              onPointerDown={() => press('ok')}
              onPointerUp={() => release('ok')}
              onPointerLeave={() => release('ok')}
              className={clsx(
                'dpad-btn w-14 h-14 rounded-full border-2 flex items-center justify-center',
                'border-[var(--color-neon)]/40 bg-[var(--color-neon-dim)] text-neon transition-all',
                pressed.has('ok') && 'pressed',
              )}
            >
              <Circle size={20} strokeWidth={2.5} />
            </button>
            <DPadButton label="Right" icon={ArrowRight} keyId="right" pressed={pressed.has('right')} onPress={press} onRelease={release} />
            <div />
            <DPadButton label="Down" icon={ArrowDown} keyId="down" pressed={pressed.has('down')} onPress={press} onRelease={release} />
            <div />
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <DPadButton label="Back" icon={X} keyId="back" pressed={pressed.has('back')} onPress={press} onRelease={release} className="!w-20 !h-10 !rounded-full text-xs" />
          </div>
        </div>
      </div>

      {/* Media Controls */}
      <div>
        <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-2.5">Media / Actions</p>
        <div className="grid grid-cols-4 gap-2">
          {actionBtn('Play', Play, 'kb KEY_MEDIA_PLAY_PAUSE', 'text-[var(--color-neon)] hover:bg-[var(--color-neon-dim)]')}
          {actionBtn('Vol+', Volume2, 'kb KEY_MEDIA_VOLUME_UP', 'text-[var(--color-cyan)] hover:bg-[var(--color-cyan-dim)]')}
          {actionBtn('Vol-', VolumeX, 'kb KEY_MEDIA_VOLUME_DOWN', 'text-[var(--color-cyan)] hover:bg-[var(--color-cyan-dim)]')}
          {actionBtn('Reset', RotateCcw, 'reboot', 'text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10')}
        </div>
      </div>

      {/* Keyboard Input */}
      <div className="glass-bright border border-[var(--color-border-bright)] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Keyboard size={14} className="text-[var(--color-cyan)]" />
          <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest">Keyboard HID Input</p>
          <button
            onClick={() => setKbMode(m => !m)}
            className={clsx('ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all',
              kbMode
                ? 'border-[var(--color-neon)]/50 text-neon bg-[var(--color-neon-dim)]'
                : 'border-[var(--color-border-bright)] text-[var(--color-muted)]'
            )}
          >
            {kbMode ? 'KB Active' : 'Enable'}
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={kbText}
            onChange={e => setKbText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendKb()}
            placeholder="Type to send via HID…"
            disabled={!kbMode || !connected}
            className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-neon)]/50 disabled:opacity-40 transition-colors"
          />
          <button
            onClick={sendKb}
            disabled={!kbMode || !connected || !kbText.trim()}
            className="px-4 py-2 rounded-lg bg-[var(--color-neon-dim)] border border-[var(--color-neon)]/40 text-neon font-bold text-sm disabled:opacity-30 hover:bg-[var(--color-neon)]/20 transition-all active:scale-95"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
