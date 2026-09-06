import { Bluetooth, MonitorSmartphone, Cpu, ChevronRight } from 'lucide-react'

interface Props {
  onConnect: () => void
}

const STEPS = [
  {
    icon: Cpu,
    color: 'text-[var(--color-warning)]',
    bg:    'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30',
    title: 'Bruce側: BLE APIを有効化',
    desc:  'BLE メニュー → "Web BLE API" を選択。\n画面に "BLE API ON / Device: Bruc" と表示されればOK。',
  },
  {
    icon: Bluetooth,
    color: 'text-[var(--color-cyan)]',
    bg:    'bg-[var(--color-cyan)]/10 border-[var(--color-cyan)]/30',
    title: 'ブラウザ: Connect BLE をタップ',
    desc:  'ペアリングダイアログで "Bruc" を選択してください。\n※ フィルターなしで全デバイスが表示されます。',
  },
  {
    icon: MonitorSmartphone,
    color: 'text-[var(--color-neon)]',
    bg:    'bg-[var(--color-neon-dim)] border-[var(--color-neon)]/30',
    title: '接続完了 → 全機能が解放',
    desc:  'ヘッダーに "Bruc" と緑バッジが点灯したら接続成功です。',
  },
]

export function ConnectGuide({ onConnect }: Props) {
  return (
    <div className="animate-fade-in-up space-y-4">
      {/* Hero */}
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-neon-dim)] border border-[var(--color-neon)]/40 flex items-center justify-center mx-auto mb-4">
          <Bluetooth size={30} className="text-neon" />
        </div>
        <h2 className="text-neon font-black text-xl tracking-wide mb-1">Bruce Hub</h2>
        <p className="text-[var(--color-muted)] text-sm">接続するには以下の手順に従ってください</p>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={i} className={`flex gap-3 p-4 rounded-xl border glass-bright ${step.bg}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[var(--color-surface-3)] border border-[var(--color-border-bright)]`}>
                <span className={`text-xs font-black ${step.color}`}>{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={13} className={step.color} />
                  <p className={`font-bold text-sm ${step.color}`}>{step.title}</p>
                </div>
                <p className="text-[var(--color-muted)] text-xs leading-relaxed whitespace-pre-line">{step.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <button
        onClick={onConnect}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm
          bg-[var(--color-neon-dim)] border border-[var(--color-neon)]/50 text-neon
          hover:bg-[var(--color-neon)]/20 active:scale-[0.98] transition-all duration-150 shadow-lg
          shadow-[var(--color-neon-glow)]"
      >
        <Bluetooth size={16} />
        Connect BLE
        <ChevronRight size={14} className="ml-auto" />
      </button>

      <p className="text-center text-[10px] text-[var(--color-muted)]">
        Web Bluetooth API（Chrome / Edge 推奨）
      </p>
    </div>
  )
}
