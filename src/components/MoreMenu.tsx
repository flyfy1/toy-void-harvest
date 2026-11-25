import { useState } from 'react'
import { openAbout, t, type ToyId } from '../i18n'
import { ShareButton } from './ShareButton'

const SITES: { id: ToyId; icon: string }[] = [
  { id: 'charge', icon: '💥' },
  { id: 'void', icon: '🕳️' },
  { id: 'smash', icon: '🔨' },
  { id: 'pop', icon: '🫧' },
  { id: 'knock', icon: '🪵' },
  { id: 'purr', icon: '🐈' },
]

/** Light toys (pale backgrounds) get dark-ink pills. */
export const LIGHT_TOYS: ToyId[] = ['purr']
export const pillClass = (toy: ToyId) =>
  LIGHT_TOYS.includes(toy)
    ? 'rounded-full border border-[#4A3A2C]/20 bg-[#FFF8EE]/55 px-3.5 py-1.5 text-sm font-medium text-[#4A3A2C]/85 backdrop-blur-md hover:bg-[#FFF8EE]/80 active:scale-95'
    : 'rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white/80 backdrop-blur-md hover:bg-white/20 active:scale-95'

export function MoreMenu({ current }: { current: ToyId }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="fixed bottom-3 right-3 z-20 flex flex-col items-end gap-2 select-none" onPointerDown={(e) => e.stopPropagation()}>
      {open && (
        <div className="flex flex-col gap-1 rounded-2xl border border-white/15 bg-black/60 p-1.5 backdrop-blur-md">
          {SITES.map((s) => (
            <a
              key={s.id}
              href={s.id === current ? undefined : `https://${s.id}.integ.life`}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${s.id === current ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 active:bg-white/20'}`}
            >
              <span className="text-lg">{s.icon}</span>
              <span>{t(`name_${s.id}`)}</span>
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              openAbout()
            }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 active:bg-white/20"
          >
            <span className="text-lg">ⓘ</span>
            <span>{t('about')}</span>
          </button>
          <a href="https://games.integ.life" className="rounded-xl px-3 py-1.5 text-xs text-white/50 hover:bg-white/10">
            {t('more_games')}
          </a>
        </div>
      )}
      <div className="flex gap-2">
      <ShareButton toy={current} />
      <button onClick={() => setOpen((o) => !o)} className={pillClass(current)}>
        {open ? '✕' : 'More ⚡'}
      </button>
      </div>
    </div>
  )
}
