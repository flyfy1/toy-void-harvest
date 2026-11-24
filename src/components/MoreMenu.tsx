import { useState } from 'react'

export const SITES = [
  { id: 'charge', url: 'https://charge.integ.life', icon: '💥', name: '蓄力核爆', en: 'Charge Burst' },
  { id: 'void', url: 'https://void.integ.life', icon: '🕳️', name: '黑洞收割', en: 'Void Harvest' },
  { id: 'smash', url: 'https://smash.integ.life', icon: '🔨', name: '暴力碎屏', en: 'Glass Smash' },
  { id: 'pop', url: 'https://pop.integ.life', icon: '🫧', name: '连锁泡泡', en: 'Chain Pop' },
] as const

export function MoreMenu({ current }: { current: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="fixed bottom-3 right-3 z-20 flex flex-col items-end gap-2 select-none" onPointerDown={(e) => e.stopPropagation()}>
      {open && (
        <div className="flex flex-col gap-1 rounded-2xl border border-white/15 bg-black/60 p-1.5 backdrop-blur-md">
          {SITES.map((s) => (
            <a
              key={s.id}
              href={s.id === current ? undefined : s.url}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${s.id === current ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 active:bg-white/20'}`}
            >
              <span className="text-lg">{s.icon}</span>
              <span>{s.name}</span>
              <span className="text-xs text-white/40">{s.en}</span>
            </a>
          ))}
          <a href="https://games.integ.life" className="rounded-xl px-3 py-1.5 text-xs text-white/50 hover:bg-white/10">
            更多游戏 · games.integ.life →
          </a>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white/80 backdrop-blur-md hover:bg-white/20 active:scale-95"
      >
        {open ? '✕' : 'More ⚡'}
      </button>
    </div>
  )
}
