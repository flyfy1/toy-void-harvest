import { useEffect, useRef, useState } from 'react'
import { MoreMenu } from './components/MoreMenu'
import { applyMeta, t } from './i18n'
import { startAnalytics, track } from './analytics'
import { landing, peakEvery, trackLanding } from './share'
import { Tag } from './components/Tag'

/** a challenge link's time (pop and void carry the sender's seconds as `t`) */
const RIVAL = (() => {
  // same rule as rivalTime in cards.ts: rounded to 0.1, nothing for a mad number
  const v = landing.recipient ? Number(new URLSearchParams(location.search).get('t')) : 0
  return v > 0 && v < 3600 ? Math.round(v * 10) / 10 : 0
})()
import { startGame } from './game'

const COARSE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

export default function App() {
  const ref = useRef<HTMLCanvasElement>(null)
  const over = useRef<HTMLCanvasElement>(null)
  const hud = useRef<HTMLDivElement>(null)
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    applyMeta('void')
    startAnalytics('void')
    trackLanding()
    let clears = 0
    let last: HTMLCanvasElement | null = null
    return startGame(
      ref.current!,
      over.current!,
      () => {
        setTouched(true)
        track('play_start')
      },
      hud.current,
      // the GL canvas reads back blank outside its frame: between pictures the card keeps the last one
      (snap, data) => {
        if (snap) last = snap
        peakEvery('void', ++clears, { snap: snap ?? last, data })
      },
    )
  }, [])
  return (
    <>
      <canvas ref={ref} />
      <canvas ref={over} className="pointer-events-none fixed inset-0" />
      <div
        ref={hud}
        className="pointer-events-none fixed left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 font-[system-ui] text-xs font-semibold tabular-nums text-white/70 backdrop-blur select-none"
      />
      {/* Touch already unlocks sound on the first drag; a mouse can sweep a whole wave silently, so it keeps the "click for sound" clause. */}
      <VoidHint text={t(COARSE ? 'hint_void_touch' : 'hint_void')} hidden={touched} />
      {RIVAL > 0 && <Tag text={t('void_tag', { s: RIVAL })} className="top-14" paper="bg-[#F7F4EC] text-[#22201C] font-medium" />}
      <MoreMenu current="void" />
    </>
  )
}

/** void's own hint: the clutter is dense and bright right behind it, so it sits on a solid dark pill and does not pulse.
 *  Same placement and phrase breaking as the shared Hint (which is left untouched). */
function VoidHint({ text, hidden }: { text: string; hidden: boolean }) {
  return (
    <div className={`pointer-events-none fixed inset-x-0 bottom-20 z-10 px-4 text-center transition-opacity duration-700 ${hidden ? 'opacity-0' : 'opacity-100'}`}>
      <p className="mx-auto inline-block max-w-[30ch] rounded-2xl bg-[#07060f]/90 px-4 py-2 text-balance text-[15px] leading-snug tracking-[0.06em] text-white/90 shadow-[0_4px_24px_rgba(0,0,0,.6)] ring-1 ring-white/10 backdrop-blur-sm [word-break:auto-phrase]">
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
