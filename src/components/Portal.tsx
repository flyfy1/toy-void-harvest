// The portal bubble and the arrival tag (shared file, in the portals chunk; mounted into their own element, so no
// toy's App needs new JSX). The bubble is a plain same-tab link beside its object: never a modal, it never takes
// focus or a touch meant for the toy (the box around it lets touches through; the link itself only after 350 ms).
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { Anchor } from '../share'
import { Tag } from './Tag'

export type Skin = 'say' | 'tag' | 'sms' | 'slip'
export interface Bubble {
  skin: Skin
  paper: string
  ink: string
  side: 'up' | 'down' | 'left' | 'right'
  /** the joke, and the line the component writes itself: `verb · host →` */
  text: string
  line: string
  /** sms: the sender */
  who: string
  label: string
  href: string
  at: Anchor
  /** the last touch: the bubble keeps 56 px away from it */
  touch: [number, number] | null
  reduced: boolean
  go: () => void
  /** ignored: it went untapped (false: it never got a fair look, e.g. a tap in its inert first 350 ms) */
  gone: (ignored?: boolean) => void
}
interface Arrival {
  arrival: string
  /** the Tag's position and paper classes, from the destination */
  tag: [string, string]
  gone: (ignored?: boolean) => void
}

let root: Root | null = null
let host: HTMLDivElement
/** Show a bubble or an arrival tag (one at a time); returns its early close. */
export function show(p: Bubble | Arrival): () => void {
  if (!root) {
    host = document.createElement('div')
    host.setAttribute('aria-live', 'polite')
    document.body.append(host)
    root = createRoot(host)
  }
  let close = () => {}
  const done = (ignored = true) => {
    root!.render(null)
    p.gone(ignored)
  }
  // rendered a frame later, so the live region exists before its text (screen readers announce it)
  requestAnimationFrame(() => root!.render('at' in p ? <PortalBubble key={Date.now()} b={p} done={done} hook={(c) => (close = c)} /> : <ArrivalTag key={Date.now()} a={p} done={done} />))
  return () => close()
}

function ArrivalTag({ a, done }: { a: Arrival; done: (ignored?: boolean) => void }) {
  useEffect(() => {
    const off = () => window.setTimeout(() => done(), 700)
    window.addEventListener('pointerdown', off, { once: true, capture: true })
    const tm = window.setTimeout(off, 6000)
    return () => {
      window.removeEventListener('pointerdown', off, true)
      window.clearTimeout(tm)
    }
  }, [])
  return <Tag text={a.arrival} className={a.tag[0]} paper={a.tag[1]} ms={6000} />
}

const LIFE = 3600
type Box = { x: number; y: number; side: Bubble['side']; ax: number; ay: number }

function place(b: Bubble, el: HTMLElement): Box | null {
  const a = b.at()
  if (!a) return null
  const [ax, ay] = a
  const W = el.offsetWidth,
    H = el.offsetHeight,
    vw = innerWidth,
    vh = innerHeight,
    g = b.skin === 'slip' ? 6 : 16
  const order: Bubble['side'][] = [b.side, ...(['up', 'down', 'right', 'left'] as const).filter((s) => s !== b.side)]
  // the toy's own controls (the pills, the text box): the bubble stays clear of them
  const ctl = [...document.querySelectorAll('button, a[href], input, textarea')].filter((e) => !host.contains(e)).map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height)
  let best: Box | null = null,
    bp = Infinity
  for (const side of order) {
    let x = side === 'up' || side === 'down' ? ax - W / 2 : side === 'right' ? ax + g : ax - g - W
    let y = side === 'left' || side === 'right' ? ay - H / 2 : side === 'up' ? ay - g - H : ay + g
    const x0 = x,
      y0 = y
    x = Math.max(8, Math.min(vw - W - 8, x))
    y = Math.max(56, Math.min(vh - H - 64, y))
    let pen = Math.hypot(x - x0, y - y0) * 0.5 + order.indexOf(side) * 20
    for (const r of ctl) {
      const ox = Math.min(x + W, r.right + 6) - Math.max(x, r.left - 6),
        oy = Math.min(y + H, r.bottom + 6) - Math.max(y, r.top - 6)
      if (ox > 0 && oy > 0) pen += 1000 + ox * oy
    }
    if (b.touch) {
      const dx = Math.max(x - b.touch[0], 0, b.touch[0] - x - W),
        dy = Math.max(y - b.touch[1], 0, b.touch[1] - y - H)
      if (Math.hypot(dx, dy) < 56) pen += 2000
    }
    // never over the object itself
    if (ax > x - 4 && ax < x + W + 4 && ay > y - 4 && ay < y + H + 4) pen += 1500
    if (pen < bp) {
      bp = pen
      best = { x, y, side, ax, ay }
    }
  }
  return best
}

function PortalBubble({ b, done, hook }: { b: Bubble; done: (ignored?: boolean) => void; hook: (close: () => void) => void }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [box, setBox] = useState<Box | null>(null)
  const [on, setOn] = useState(false)
  const [live, setLive] = useState(false)
  const st = useRef({ left: LIFE, from: 0, paused: false, leaving: false, tm: 0, armed: false, early: false })
  useLayoutEffect(() => {
    const p = place(b, ref.current!)
    if (!p) return done(false)
    setBox(p)
  }, [])
  useEffect(() => {
    if (!box) return
    const s = st.current
    const leave = (ms: number) => {
      if (s.leaving) return
      s.leaving = true
      clearTimeout(s.tm)
      setOn(false)
      setLive(false)
      s.tm = window.setTimeout(() => done(!s.early), ms)
    }
    const run = () => {
      s.from = performance.now()
      s.tm = window.setTimeout(() => leave(b.reduced ? 120 : 400), s.left)
    }
    hook(() => leave(200))
    requestAnimationFrame(() => setOn(true))
    run()
    const armed = window.setTimeout(() => ((s.armed = true), setLive(true)), 350)
    // any gesture that starts outside it, the page hidden, or back from another page: it goes at once
    const down = (e: PointerEvent) => {
      if (ref.current?.contains(e.target as Node)) return
      if (!s.armed) s.early = true
      leave(200)
    }
    const vis = () => document.hidden && leave(200)
    const back = (e: PageTransitionEvent) => e.persisted && leave(0)
    const key = (e: KeyboardEvent) => e.key === 'Escape' && leave(200)
    addEventListener('pointerdown', down, true)
    document.addEventListener('visibilitychange', vis)
    addEventListener('pageshow', back)
    addEventListener('keydown', key)
    // hover or focus pauses its clock
    const el = ref.current!
    const pause = () => {
      if (s.paused || s.leaving) return
      s.paused = true
      clearTimeout(s.tm)
      s.left -= performance.now() - s.from
    }
    const resume = () => {
      if (!s.paused || s.leaving || el.matches(':hover') || el === document.activeElement) return
      s.paused = false
      s.left = Math.max(s.left, 1200)
      run()
    }
    const evs: [string, () => void][] = [['focus', pause], ['mouseenter', pause], ['blur', resume], ['mouseleave', resume]]
    for (const [e, f] of evs) el.addEventListener(e, f)
    return () => {
      clearTimeout(s.tm)
      clearTimeout(armed)
      removeEventListener('pointerdown', down, true)
      document.removeEventListener('visibilitychange', vis)
      removeEventListener('pageshow', back)
      removeEventListener('keydown', key)
      for (const [e, f] of evs) el.removeEventListener(e, f)
    }
  }, [box])

  const { skin, paper, ink } = b
  const side = box?.side ?? b.side
  const moveIn = !b.reduced && !on ? (side === 'down' ? 'translateY(-6px)' : side === 'up' ? 'translateY(6px)' : 'none') : 'none'
  const tilt = skin === 'tag' ? ' rotate(2deg)' : ''
  const sh = skin === 'slip' ? 'none' : skin === 'sms' ? '0 2px 10px rgba(0,0,0,.18)' : '0 4px 14px rgba(0,0,0,.22)'
  const st0: CSSProperties = {
    position: 'fixed',
    left: box ? box.x : -9999,
    top: box ? box.y : 0,
    maxWidth: 280,
    minHeight: 44,
    boxSizing: 'border-box',
    padding: skin === 'slip' ? '6px 12px' : skin === 'tag' ? '8px 14px 8px 26px' : '9px 14px',
    background: paper,
    color: ink,
    borderRadius: skin === 'say' ? 18 : skin === 'sms' ? '6px 16px 16px 16px' : skin === 'slip' ? 4 : 6,
    boxShadow: sh,
    backdropFilter: skin === 'slip' ? 'blur(6px)' : undefined,
    fontSize: 14,
    lineHeight: 1.35,
    textDecoration: 'none',
    display: 'block',
    pointerEvents: live ? 'auto' : 'none',
    opacity: on ? 1 : 0,
    transform: moveIn + tilt,
    transition: b.reduced ? 'opacity 120ms linear' : 'opacity 300ms ease-out, transform 300ms ease-out',
    WebkitTapHighlightColor: 'transparent',
    outlineOffset: 3,
  }
  // the tail of a speech bubble, the string of a tag: toward the object
  let deco: ReactNode = null
  if (box && ref.current && (skin === 'say' || skin === 'tag')) {
    const W = ref.current.offsetWidth,
      H = ref.current.offsetHeight
    const vert = side === 'up' || side === 'down'
    if (skin === 'say') {
      const tx = vert ? Math.max(18, Math.min(W - 18, box.ax - box.x)) : side === 'right' ? 0 : W
      const ty = vert ? (side === 'up' ? H : 0) : Math.max(14, Math.min(H - 14, box.ay - box.y))
      const d = vert ? (side === 'up' ? 'M-7,-1 L7,-1 L0,9 Z' : 'M-7,1 L7,1 L0,-9 Z') : side === 'right' ? 'M1,-7 L1,7 L-9,0 Z' : 'M-1,-7 L-1,7 L9,0 Z'
      deco = (
        <svg aria-hidden width="1" height="1" style={{ position: 'absolute', left: tx, top: ty, overflow: 'visible' }}>
          <path d={d} fill={paper} />
        </svg>
      )
    } else {
      // the string, from the punched hole to the object (at most 60 px of it)
      const hx = 12,
        hy = H / 2
      const dx = box.ax - (box.x + hx),
        dy = box.ay - (box.y + hy)
      const k = Math.min(1, 60 / Math.max(1, Math.hypot(dx, dy)))
      deco = (
        <>
          <span aria-hidden style={{ position: 'absolute', left: hx - 4, top: hy - 4, width: 8, height: 8, borderRadius: 8, border: `1px solid ${ink}`, opacity: 0.5, boxSizing: 'border-box' }} />
          <svg aria-hidden width="1" height="1" style={{ position: 'absolute', left: hx, top: hy, overflow: 'visible' }}>
            <path d={`M0,0 Q${dx * k * 0.5},${dy * k * 0.5 + 10} ${dx * k},${dy * k}`} stroke={paper === '#F4F1EA' ? '#B3261E' : ink} strokeOpacity=".45" strokeWidth="1" fill="none" />
          </svg>
        </>
      )
    }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 25 }}>
      <a ref={ref} href={b.href} aria-label={b.label} onClick={b.go} style={st0} data-portal="">
        {deco}
        {b.who && <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3A8DDE' }}>{b.who}</span>}
        <span style={{ display: 'block', fontWeight: 500 }}>{b.text}</span>
        <span style={{ display: 'block', fontSize: 12, opacity: 0.75, marginTop: 1 }}>{b.line}</span>
      </a>
    </div>
  )
}
