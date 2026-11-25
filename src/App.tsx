import { useEffect, useRef, useState } from 'react'
import { MoreMenu } from './components/MoreMenu'
import { applyMeta, t } from './i18n'
import { startAnalytics, track } from './analytics'
import { Hint } from './components/Hint'
import { startGame } from './game'

const COARSE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

export default function App() {
  const ref = useRef<HTMLCanvasElement>(null)
  const hud = useRef<HTMLDivElement>(null)
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    applyMeta('void')
    startAnalytics('void')
    return startGame(
      ref.current!,
      () => {
        setTouched(true)
        track('play_start')
      },
      hud.current,
    )
  }, [])
  return (
    <>
      <canvas ref={ref} />
      <div
        ref={hud}
        className="pointer-events-none fixed left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 font-[system-ui] text-xs font-semibold tabular-nums text-white/70 backdrop-blur select-none"
      />
      {/* Touch already unlocks sound on the first drag; a mouse can sweep a whole wave silently, so it keeps the "click for sound" clause. */}
      <Hint text={t(COARSE ? 'hint_void_touch' : 'hint_void')} hidden={touched} toy="void" />
      <MoreMenu current="void" />
    </>
  )
}
