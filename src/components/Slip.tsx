import { useEffect, useRef, useState } from 'react'
import type { ToyId } from '../i18n'
import { emit, landing, openSheet, store, trackShare } from '../share'
import { fileName, shareExtra, shareText, shareUrl } from '../cards'

/** The slip went away: on its own (`swiped` false) or swiped off. The pill keeps a dot either way. */
function slipGone(swiped: boolean) {
  if (swiped) store.swiped++
  store.slip = 0
  store.dot = true
  emit()
}



/**
 * A tap on the slip. On a phone that can share files it goes straight to the OS share sheet (the slip
 * is only offered once the image exists, so this runs inside the tap). Recipients, WeChat and desktop
 * get the sheet.
 */
function slipTap(toy: ToyId) {
  const card = store.card
  const file = card ? new File([card.blob], fileName(toy), { type: 'image/png' }) : null
  const phone = matchMedia('(pointer: coarse)').matches && typeof navigator.share === 'function'
  if (!landing.recipient && file && phone && navigator.canShare?.({ files: [file] })) {
    store.slip = 0
    store.dot = false
    emit()
    trackShare('method', 'file', 'slip')
    navigator.share({ files: [file], text: `${shareText(toy)} ${shareUrl(toy, 'f')}` }).then(
      () => trackShare('done', 'file', 'slip', shareExtra(toy)),
      () => {
        /* cancelled */
      },
    )
    return
  }
  openSheet('slip')
}

/**
 * The slip: a small tilted thumbnail of the card that slides in above the Share pill after a peak, like a
 * phone's screenshot thumbnail. No text: the picture is the offer. Stays 6 s; a swipe sends it away.
 */
export default function Slip({ toy, src }: { toy: ToyId; src: string }) {
  const [phase, setPhase] = useState<'in' | 'on' | 'out'>('in')
  const start = useRef<{ x: number; y: number } | null>(null)
  const gone = useRef(false)
  const leave = (swiped: boolean) => {
    if (gone.current) return
    gone.current = true
    setPhase('out')
    window.setTimeout(() => slipGone(swiped), 260)
  }
  useEffect(() => {
    const a = requestAnimationFrame(() => setPhase('on'))
    const tm = window.setTimeout(() => leave(false), 6000)
    return () => {
      cancelAnimationFrame(a)
      window.clearTimeout(tm)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <button
      type="button"
      aria-label="Share card"
      onPointerDown={(e) => {
        e.stopPropagation()
        start.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerMove={(e) => {
        const s = start.current
        if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 36) {
          start.current = null
          leave(true)
        }
      }}
      onClick={() => {
        if (gone.current) return
        gone.current = true
        slipTap(toy)
      }}
      className="fixed bottom-[68px] right-3 z-30 w-[92px] touch-none rounded-[10px] border-[3px] border-white bg-white shadow-[0_10px_30px_rgba(0,0,0,.45)] transition-[transform,opacity] duration-300 ease-out"
      style={{
        transform: phase === 'on' ? 'translateX(0) rotate(-4deg)' : 'translateX(140%) rotate(6deg)',
        opacity: phase === 'on' ? 1 : 0,
      }}
    >
      <img src={src} alt="" draggable={false} className="block w-full rounded-[7px]" />
    </button>
  )
}
