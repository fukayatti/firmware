import { useState, useCallback, useEffect } from 'react'
import {
  Gamepad2, Terminal, Layers, Settings2, Subtitles, AlertCircle, X, Key,
} from 'lucide-react'

import { Header } from './components/Header'
import { TabBar } from './components/TabBar'
import type { Tab } from './components/TabBar'
import { GamepadTab } from './components/GamepadTab'
import { TerminalTab } from './components/TerminalTab'
import { ModulesTab } from './components/ModulesTab'
import { SettingsTab } from './components/SettingsTab'
import { SubtitleHUD } from './components/SubtitleHUD'
import { ConnectGuide } from './components/ConnectGuide'
import { TotpTab } from './components/TotpTab'

import { useBle } from './useBle'
import type { BleState, LogEntry } from './types'

const TABS: Tab[] = [
  { id: 'gamepad',  label: 'Control',  icon: Gamepad2  },
  { id: 'terminal', label: 'Terminal', icon: Terminal   },
  { id: 'modules',  label: 'Modules',  icon: Layers     },
  { id: 'totp',     label: 'TOTP',     icon: Key        },
  { id: 'settings', label: 'Actions',  icon: Settings2  },
]

function makeLog(text: string): LogEntry {
  const level = text.startsWith('[OK]')  || text.startsWith('OK:')  ? 'ok'
    : text.startsWith('[ERR]') || text.startsWith('ERR:') ? 'err'
    : text.startsWith('[WARN]')                           ? 'warn'
    : text.includes('>>') || text.startsWith('>')         ? 'info'
    : 'dim'
  const ts = new Date().toLocaleTimeString('ja-JP', { hour12: false })
  return { id: crypto.randomUUID(), ts, level, text }
}

// Toast notification
interface Toast { id: number; msg: string }
let toastCounter = 0

export default function App() {
  const [tab,        setTab]        = useState('gamepad')
  const [bleState,   setBleState]   = useState<BleState>({
    connected: false, deviceName: null, battery: null, rssi: null,
  })
  const [logs,       setLogs]       = useState<LogEntry[]>([
    makeLog('Bruce Hub ready. BLE menu → "Web BLE API" でデバイス側を有効にしてから接続してください。'),
  ])
  const [subtitleEn, setSubtitleEn] = useState('')
  const [subtitleJa, setSubtitleJa] = useState('')
  const [showSubs,   setShowSubs]   = useState(true)
  const [toasts,     setToasts]     = useState<Toast[]>([])

  const pushToast = useCallback((msg: string) => {
    const id = toastCounter++
    setToasts(t => [...t, { id, msg }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 6000)
  }, [])

  const addLog = useCallback((text: string) => {
    if (text.startsWith('SUB_EN:')) { setSubtitleEn(text.slice(7)); return }
    if (text.startsWith('SUB_JA:')) { setSubtitleJa(text.slice(7)); return }
    if (text.startsWith('BAT:')) {
      const val = parseInt(text.slice(4))
      if (!isNaN(val)) setBleState(s => ({ ...s, battery: val }))
    }
    setLogs(prev => [...prev.slice(-500), makeLog(text)])
  }, [])

  const handleConnect = useCallback((name: string) => {
    setBleState(s => ({ ...s, connected: true, deviceName: name }))
    setLogs(prev => [...prev, makeLog(`OK: Connected to ${name}`)])
  }, [])

  const handleDisconnect = useCallback(() => {
    setBleState({ connected: false, deviceName: null, battery: null, rssi: null })
    setLogs(prev => [...prev, makeLog('[WARN] Disconnected.')])
  }, [])

  const handleError = useCallback((msg: string) => {
    setLogs(prev => [...prev, makeLog(`[ERR] ${msg}`)])
    pushToast(msg)
  }, [pushToast])

  const { connect, disconnect, send } = useBle(
    addLog, handleConnect, handleDisconnect, handleError,
  )

  const handleSend = useCallback(async (cmd: string) => {
    const ts = new Date().toLocaleTimeString('ja-JP', { hour12: false })
    setLogs(prev => [...prev, { id: crypto.randomUUID(), ts, level: 'info' as const, text: `>> ${cmd}` }])
    await send(cmd)
  }, [send])

  const clearLogs = useCallback(() => setLogs([]), [])

  const renderTab = () => {
    switch (tab) {
      case 'gamepad':  return <GamepadTab  onCommand={handleSend} connected={bleState.connected} />
      case 'terminal': return <TerminalTab logs={logs} onSend={handleSend} onClear={clearLogs} connected={bleState.connected} />
      case 'modules':  return <ModulesTab  onCommand={handleSend} connected={bleState.connected} />
      case 'totp':     return <TotpTab     onCommand={handleSend} connected={bleState.connected} />
      case 'settings': return <SettingsTab onCommand={handleSend} connected={bleState.connected} />
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg)] relative">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, var(--color-neon) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-20 w-80 h-80 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, var(--color-cyan) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, var(--color-purple) 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <div className="max-w-2xl mx-auto w-full">
        <Header ble={bleState} onConnect={connect} onDisconnect={disconnect} />
      </div>

      {/* Tab bar – only shown when connected */}
      {bleState.connected && (
        <div className="max-w-2xl mx-auto w-full">
          <TabBar tabs={TABS} active={tab} onChange={setTab} />
        </div>
      )}

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 pb-28">
        {bleState.connected ? renderTab() : <ConnectGuide onConnect={connect} />}
      </main>

      {/* Toast stack */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[min(92vw,520px)] pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="animate-fade-in-up flex items-start gap-3 px-4 py-3 rounded-xl glass-bright border border-[var(--color-danger)]/40 shadow-xl pointer-events-auto">
            <AlertCircle size={16} className="text-[var(--color-danger)] shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--color-text)] flex-1 whitespace-pre-line">{t.msg}</p>
            <button onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))} className="text-[var(--color-muted)] hover:text-[var(--color-text)] shrink-0">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Subtitle FAB */}
      <button
        onClick={() => setShowSubs(s => !s)}
        className="fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full glass-bright border border-[var(--color-border-bright)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-neon)] hover:border-[var(--color-neon)]/40 transition-all shadow-xl active:scale-90"
        title="Toggle subtitles"
      >
        <Subtitles size={18} />
      </button>

      {showSubs && <SubtitleHUD subtitleEn={subtitleEn} subtitleJa={subtitleJa} />}
    </div>
  )
}
