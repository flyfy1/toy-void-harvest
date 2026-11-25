import type { ToyId } from '../i18n'
import { LIGHT_TOYS } from './MoreMenu'

/** Dark toys whose scene is busy right behind the hint get a dark backing pill. */
const BUSY_TOYS: ToyId[] = ['void']

/** Ghost hint that fades after the first interaction. On narrow phones it breaks at the ' · ' separators first, then inside a phrase; light toys get ink on a cream pill. */
export function Hint({ text, hidden, toy }: { text: string; hidden: boolean; toy?: ToyId }) {
  const light = !!toy && LIGHT_TOYS.includes(toy)
  const busy = !!toy && BUSY_TOYS.includes(toy)
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-20 z-10 px-4 text-center transition-opacity duration-700 ${hidden ? 'opacity-0' : 'animate-pulse opacity-100'}`}
    >
      <p
        className={`mx-auto max-w-[30ch] text-balance text-[15px] leading-snug tracking-[0.08em] [word-break:auto-phrase] ${light ? 'inline-block rounded-2xl bg-[#FFF9F0]/78 px-3 py-1.5 text-[#4A3A2C]/75' : busy ? 'inline-block rounded-2xl bg-[#07060f]/75 px-3 py-1.5 text-white/80' : 'text-white/60'}`}
        style={light ? undefined : { textShadow: '0 1px 6px rgba(0,0,0,.55)' }}
      >
        {text.split(' · ').map((part, i, all) => (
          <span key={i} className="inline-block text-balance">
            {part}
            {i < all.length - 1 && '\u00a0·\u00a0'}
          </span>
        ))}
      </p>
    </div>
  )
}
