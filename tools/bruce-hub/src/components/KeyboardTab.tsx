import { useState, useEffect } from 'react'
import { Keyboard, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerDownLeft, Command, Delete } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  onCommand: (cmd: string) => Promise<void>
  connected: boolean
}

// Arduino USBHIDKeyboard keycodes
const KEY_CODES = {
  ENTER: 176,
  ESC: 177,
  BACKSPACE: 178,
  TAB: 179,
  UP: 218,
  DOWN: 217,
  LEFT: 216,
  RIGHT: 215,
  LEFT_CTRL: 128,
  LEFT_SHIFT: 129,
  LEFT_ALT: 130,
  LEFT_GUI: 131,
  DELETE: 212,
  SPACE: 32,
}

export function KeyboardTab({ onCommand, connected }: Props) {
  const [text, setText] = useState('')

  // Start/Stop keyboard session when tab mounts/unmounts
  useEffect(() => {
    if (connected) {
      onCommand('badusb kb_start')
    }
    return () => {
      if (connected) {
        onCommand('badusb kb_stop')
      }
    }
  }, [connected, onCommand])

  const handleType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text) return
    await onCommand(`badusb kb_type "${text}"`)
    setText('')
  }

  const handlePress = async (...keys: number[]) => {
    const args = keys.join(' ')
    await onCommand(`badusb kb_press ${args}`)
  }

  const handleCharPress = async (char: string, modifier?: number) => {
    const charCode = char.charCodeAt(0)
    if (modifier) {
      await handlePress(modifier, charCode)
    } else {
      await handlePress(charCode)
    }
  }

  if (!connected) {
    return (
      <div className="animate-fade-in-up text-center py-12 space-y-3">
        <Keyboard size={36} className="mx-auto text-[var(--color-danger)]" />
        <p className="font-bold text-[var(--color-danger)]">未接続</p>
        <p className="text-[var(--color-muted)] text-sm">BLE接続が必要です</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up flex flex-col h-full space-y-6">
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-purple)]/10 border border-[var(--color-purple)]/30 flex items-center justify-center">
          <Keyboard size={18} className="text-[var(--color-purple)]" />
        </div>
        <div>
          <p className="font-bold text-sm text-[var(--color-purple)]">USB Keyboard</p>
          <p className="text-[10px] text-[var(--color-muted)]">リアルタイム操作</p>
        </div>
      </div>

      {/* Text Typer */}
      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs font-bold text-[var(--color-muted)]">文字入力 (Type Text)</p>
        <form onSubmit={handleType} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type here..."
            className="flex-1 bg-[var(--color-surface-2)] border border-[var(--color-border-bright)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-purple)]/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!text}
            className="px-5 rounded-xl bg-[var(--color-purple)]/20 text-[var(--color-purple)] font-bold border border-[var(--color-purple)]/40 hover:bg-[var(--color-purple)]/30 active:scale-95 disabled:opacity-50 transition-all"
          >
            Send
          </button>
        </form>
      </div>

      {/* Special Keys */}
      <div className="glass-panel p-4 space-y-4 flex-1">
        <p className="text-xs font-bold text-[var(--color-muted)]">特殊キー (Special Keys)</p>
        
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handlePress(KEY_CODES.ENTER)} className="btn-key">
            <CornerDownLeft size={16} /> Enter
          </button>
          <button onClick={() => handlePress(KEY_CODES.BACKSPACE)} className="btn-key text-[var(--color-danger)]">
            <Delete size={16} /> Backspace
          </button>
          <button onClick={() => handlePress(KEY_CODES.ESC)} className="btn-key">
            Esc
          </button>
          <button onClick={() => handlePress(KEY_CODES.TAB)} className="btn-key">
            Tab
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <button onClick={() => handleCharPress('c', KEY_CODES.LEFT_CTRL)} className="btn-key">
            Ctrl+C
          </button>
          <button onClick={() => handleCharPress('v', KEY_CODES.LEFT_CTRL)} className="btn-key">
            Ctrl+V
          </button>
          <button onClick={() => handleCharPress('z', KEY_CODES.LEFT_CTRL)} className="btn-key">
            Ctrl+Z
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button onClick={() => handleCharPress('a', KEY_CODES.LEFT_CTRL)} className="btn-key">
            Ctrl+A (全選択)
          </button>
          <button onClick={() => handleCharPress('r', KEY_CODES.LEFT_GUI)} className="btn-key text-[var(--color-cyan)]">
            <Command size={16} /> Win+R
          </button>
        </div>

        {/* Arrow Keys */}
        <div className="flex flex-col items-center gap-2 pt-4">
          <button onClick={() => handlePress(KEY_CODES.UP)} className="btn-key w-16 h-12">
            <ArrowUp size={20} />
          </button>
          <div className="flex gap-2">
            <button onClick={() => handlePress(KEY_CODES.LEFT)} className="btn-key w-16 h-12">
              <ArrowLeft size={20} />
            </button>
            <button onClick={() => handlePress(KEY_CODES.DOWN)} className="btn-key w-16 h-12">
              <ArrowDown size={20} />
            </button>
            <button onClick={() => handlePress(KEY_CODES.RIGHT)} className="btn-key w-16 h-12">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        .btn-key {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border-bright);
          border-radius: 12px;
          color: var(--color-text);
          font-size: 13px;
          font-weight: 600;
          transition: all 0.1s;
        }
        .btn-key:active {
          transform: scale(0.95);
          background: var(--color-surface-3);
          border-color: var(--color-purple);
        }
      `}</style>
    </div>
  )
}
