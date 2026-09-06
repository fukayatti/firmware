import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

export interface Tab {
  id: string
  label: string
  icon: LucideIcon
}

interface Props {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}

export function TabBar({ tabs, active, onChange }: Props) {
  return (
    <nav className="flex glass border-b border-[var(--color-border)] sticky top-[57px] z-40 max-w-2xl mx-auto w-full">
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold tracking-wider uppercase transition-all duration-200 relative',
              isActive
                ? 'text-neon'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            )}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[var(--color-neon)] shadow-[0_0_8px_var(--color-neon-glow)]" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
