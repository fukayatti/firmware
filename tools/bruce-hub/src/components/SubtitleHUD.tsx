import { Subtitles } from 'lucide-react'

interface Props {
  subtitleEn: string
  subtitleJa: string
}

export function SubtitleHUD({ subtitleEn, subtitleJa }: Props) {
  if (!subtitleEn && !subtitleJa) return null
  return (
    <div className="fixed bottom-20 left-0 right-0 z-30 px-4 pointer-events-none">
      <div className="max-w-2xl mx-auto">
        <div className="border-gradient bg-[var(--color-surface)]/90 backdrop-blur-xl rounded-2xl px-5 py-4 shadow-2xl">
          <div className="flex items-center gap-1.5 mb-2">
            <Subtitles size={11} className="text-neon opacity-60" />
            <span className="text-[9px] text-[var(--color-muted)] uppercase tracking-widest">Live Translation</span>
          </div>
          {subtitleEn && (
            <p className="text-[var(--color-muted)] text-sm leading-relaxed mb-1">{subtitleEn}</p>
          )}
          {subtitleJa && (
            <p className="text-neon text-base font-semibold leading-relaxed">{subtitleJa}</p>
          )}
        </div>
      </div>
    </div>
  )
}
