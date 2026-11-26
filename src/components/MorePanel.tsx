import { locale, openAbout, type LiveId, type ToyId } from '../i18n'
import { PANEL } from '../names'
import { IconInfo } from './Icons'
import { TOY_ICONS } from './ToyIcons'

/** The live toys (crunch, pour, stamp and zip join when they launch). */
const SITES: LiveId[] = ['charge', 'void', 'smash', 'pop', 'knock', 'purr', 'squish', 'scratch', 'peel', 'twirl', 'yoink', 'silk']

/** The open More menu: every live toy with its glyph, How to play, games.integ.life. Its own chunk (names.ts and
 *  ToyIcons.tsx ride with it), fetched ahead by MoreMenu when the page is idle. */
export default function MorePanel({ current, onClose }: { current: ToyId; onClose: () => void }) {
  const T = PANEL[locale]
  return (
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
            <span>{T[`name_${id}`]}</span>
          </a>
        )
      })}
      <button
        type="button"
        onClick={() => {
          onClose()
          openAbout()
        }}
        className="flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 text-left text-sm text-white/80 hover:bg-white/10 active:bg-white/20"
      >
        <IconInfo />
        <span>{T.about}</span>
      </button>
      <a href="https://games.integ.life" className="flex min-h-[44px] items-center rounded-xl px-3 text-xs text-white/50 hover:bg-white/10">
        {T.more_games}
      </a>
    </div>
  )
}
