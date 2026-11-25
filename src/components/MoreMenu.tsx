import { useState } from 'react'
import { openAbout, t, type ToyId } from '../i18n'
import { ShareButton } from './ShareButton'
import { IconClose, IconGrid, IconInfo, TOY_ICONS } from './Icons'

const SITES: ToyId[] = ['charge', 'void', 'smash', 'pop', 'knock', 'purr', 'squish']

/** Light toys (pale backgrounds) get dark-ink pills. */
export const LIGHT_TOYS: ToyId[] = ['purr', 'pop', 'squish']
export const pillClass = (toy: ToyId) =>
  LIGHT_TOYS.includes(toy)
    ? 'inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#4A3A2C]/12 bg-[#FFF9F0]/78 px-[14px] text-sm font-medium leading-none text-[#4A3A2C]/90 shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_4px_14px_rgba(74,58,44,.12)] backdrop-blur-md hover:bg-[#FFF9F0]/90 active:scale-95'
    : 'inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-white/10 px-[14px] text-sm font-medium leading-none text-white/80 backdrop-blur-md hover:bg-white/20 active:scale-95'

export function MoreMenu({ current }: { current: ToyId }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="fixed bottom-3 right-3 z-20 flex flex-col items-end gap-2 select-none" onPointerDown={(e) => e.stopPropagation()}>
      {open && (
        <div className="flex flex-col gap-1 rounded-2xl border border-white/15 bg-black/60 p-1.5 backdrop-blur-md">
          {SITES.map((id) => {
            const Icon = TOY_ICONS[id]
            return (
              <a
                key={id}
                href={id === current ? undefined : `https://${id}.integ.life`}
                className={`flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 text-sm ${id === current ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 active:bg-white/20'}`}
              >
                <Icon />
                <span>{t(`name_${id}`)}</span>
              </a>
            )
          })}
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              openAbout()
            }}
            className="flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 text-left text-sm text-white/80 hover:bg-white/10 active:bg-white/20"
          >
            <IconInfo />
            <span>{t('about')}</span>
          </button>
          <a href="https://games.integ.life" className="flex min-h-[44px] items-center rounded-xl px-3 text-xs text-white/50 hover:bg-white/10">
            {t('more_games')}
          </a>
        </div>
      )}
      <div className="flex gap-2">
      <ShareButton toy={current} />
      <button onClick={() => setOpen((o) => !o)} className={pillClass(current)} aria-label={open ? 'Close' : t('more')}>
        {open ? <IconClose /> : <><IconGrid />{t('more')}</>}
      </button>
      </div>
    </div>
  )
}
