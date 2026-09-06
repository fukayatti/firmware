import { Bluetooth, MonitorSmartphone, Cpu, ChevronRight, AlertTriangle, ExternalLink } from 'lucide-react'

interface Props {
  onConnect: () => void
}

// Detect iOS Safari (Web Bluetooth not supported)
function isIOSSafari(): boolean {
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isBluefyOrChrome = /Bluefy|CriOS|FxiOS/.test(ua)
  return isIOS && !isBluefyOrChrome
}

// Detect if Web Bluetooth is available at all
function hasWebBluetooth(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator
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

function IOSBanner() {
  const currentUrl = window.location.href
  const bluefyUrl  = `bluefy://open?url=${encodeURIComponent(currentUrl)}`

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/40 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} className="text-[var(--color-danger)]" />
        </div>
        <h2 className="font-black text-xl tracking-wide mb-1 text-[var(--color-danger)]">
          Safari は非対応
        </h2>
        <p className="text-[var(--color-muted)] text-sm">
          iOS Safari は Web Bluetooth API を実装していません
        </p>
      </div>

      {/* Bluefy CTA */}
      <div className="p-4 rounded-xl border glass-bright bg-[var(--color-cyan)]/10 border-[var(--color-cyan)]/30 space-y-3">
        <div className="flex items-center gap-2">
          <Bluetooth size={16} className="text-[var(--color-cyan)]" />
          <p className="font-bold text-sm text-[var(--color-cyan)]">Bluefyで開く（推奨）</p>
        </div>
        <p className="text-[var(--color-muted)] text-xs leading-relaxed">
          Bluefy は iOS 向けの Web Bluetooth 対応ブラウザです。<br />
          インストール後、このリンクをタップするか<br />
          Bluefy 内でこのURLを開いてください。
        </p>
        <div className="flex gap-2">
          <a
            href="https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold
              bg-[var(--color-surface-3)] border border-[var(--color-border-bright)]
              text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <ExternalLink size={12} />
            App Store
          </a>
          <a
            href={bluefyUrl}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold
              bg-[var(--color-cyan)]/20 border border-[var(--color-cyan)]/50
              text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/30 transition-colors"
          >
            <Bluetooth size={12} />
            Bluefyで開く
          </a>
        </div>
      </div>

      {/* Shortcut tip */}
      <div className="p-3 rounded-xl border glass-bright border-[var(--color-border-bright)]">
        <p className="text-[10px] text-[var(--color-muted)] leading-relaxed">
          💡 <strong className="text-[var(--color-text)]">ホーム画面に追加するには</strong>：<br />
          Bluefy でこのページを開いた状態で、画面右下の共有ボタン → 「Add to Home Screen」。<br />
          タップすると Bluefy エンジンで開くので Web Bluetooth が使えます。
        </p>
      </div>
    </div>
  )
}

export function ConnectGuide({ onConnect }: Props) {
  // iOS Safari: show Bluefy redirect banner instead
  if (isIOSSafari()) return <IOSBanner />

  // No Web Bluetooth at all (old browser etc.)
  if (!hasWebBluetooth()) {
    return (
      <div className="animate-fade-in-up text-center py-12 space-y-3">
        <AlertTriangle size={36} className="mx-auto text-[var(--color-danger)]" />
        <p className="font-bold text-[var(--color-danger)]">Web Bluetooth 非対応ブラウザ</p>
        <p className="text-[var(--color-muted)] text-sm">Chrome / Edge / Bluefy をお使いください。</p>
      </div>
    )
  }

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
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[var(--color-surface-3)] border border-[var(--color-border-bright)]">
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
        Web Bluetooth API（Chrome / Edge / Bluefy 対応）
      </p>
    </div>
  )
}
