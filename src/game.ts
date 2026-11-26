import { audio, pentaFreq, type Riser } from './engine/AudioEngine'
import { act, track } from './analytics'
import { offer, stats } from './share'
import { HitStop, Shake, clamp, easeOutBack, haptic, runLoop } from './engine/juice'
import { Renderer } from './gl'
import { ATLAS, K, MESS, RETURNS, bakeAtlas, cellUV, type ReturnId } from './clutter'
import { bakeSky, rng } from './sky'
import { FONT, vt } from './voidStrings'

interface Item {
  x: number
  y: number
  hx: number
  hy: number
  vx: number
  vy: number
  size: number
  k: number // atlas cell
  phase: number
  rot: number
  spin: number
  appear: number // seconds until it pops in
  state: 0 | 1 | 2 // idle, captured, eaten
  pr: number // polar radius while captured
  pa: number // polar angle while captured
  vr: number // radial speed while captured (for the noodle's pitch)
  ret: ReturnId | null // a returned item (the burp)
  land: number // time it came to rest (returned items), -1 before
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  r: number
  g: number
  b: number
}

const CX = [-1, 1, 1, -1]
const CY = [-1, -1, 1, 1]
const CU = [0, 2, 2, 0]
const CV = [1, 1, 3, 3]
const UV = Array.from({ length: K.Count }, (_, k) => cellUV(k))
const DOT_UV = UV[K.Dot]
const WHITE_UV = (() => {
  const u = UV[K.White]
  const cx = (u[0] + u[2]) / 2
  const cy = (u[1] + u[3]) / 2
  return [cx, cy, cx, cy]
})()

/** the clutter groups the share card counts (cards.ts VOID_ATE): socks, receipt, keys, charger, unread, client email, Monday */
const GROUP: Record<number, number> = { [K.SockA]: 0, [K.SockB]: 0, [K.SockC]: 0, [K.Receipt]: 1, [K.Keys]: 2, [K.Charger]: 3, [K.Bubble]: 4, [K.Email]: 5, [K.Monday]: 6 }
const GROUP_KEYS = ['sock', 'receipt', 'keys', 'charger', 'bubble', 'email', 'monday']

/**
 * `onPeak`: a wave cleared (after the hole gives something back, when it does), with a picture taken in
 * the render frame (WebGL reads back blank later) and the numbers for the card.
 */
export function startGame(canvas: HTMLCanvasElement, overlay: HTMLCanvasElement, onFirst: () => void, hud?: HTMLElement | null, onPeak?: (snap: HTMLCanvasElement | null, data: Record<string, number>) => void): () => void {
  const q = new URLSearchParams(location.search)
  const DEV = import.meta.env.DEV
  const seed = Number(q.get('seed') ?? 1) || 1
  const rnd = q.has('seed') ? rng(seed) : Math.random
  const rr = (a: number, b: number) => a + rnd() * (b - a)

  // WebGL when we can get it; a plain Canvas 2D picture (no lensing) when we cannot, or while the context is lost
  const atlas = bakeAtlas()
  let sky: HTMLCanvasElement | null = null
  let gl: Renderer | null = null
  let fb: HTMLCanvasElement | null = null
  let fctx: CanvasRenderingContext2D | null = null
  const startGL = () => {
    if (DEV && q.has('nogl')) return false
    try {
      const r = new Renderer(canvas)
      r.setAtlas(atlas)
      r.resize(stage.w, stage.h, stage.dpr)
      if (sky) r.setBackground(sky)
      r.warm()
      gl = r
      if (fb) fb.style.display = 'none'
      return true
    } catch {
      gl = null
      return false
    }
  }
  const sizeFallback = () => {
    if (!fb) return
    fb.width = Math.round(stage.w * stage.dpr)
    fb.height = Math.round(stage.h * stage.dpr)
    fb.style.width = stage.w + 'px'
    fb.style.height = stage.h + 'px'
  }
  const useFallback = () => {
    gl = null
    if (!fb) {
      // a sibling canvas on top of the GL one; it lets pointer events through to the GL canvas
      fb = document.createElement('canvas')
      fb.className = 'pointer-events-none fixed inset-0'
      canvas.after(fb)
      fctx = fb.getContext('2d', { alpha: false })
      sizeFallback()
    }
    fb.style.display = ''
  }
  const onLost = (e: Event) => {
    e.preventDefault()
    useFallback()
  }
  const onRestored = () => {
    if (!startGL()) useFallback()
  }
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener('webglcontextrestored', onRestored)
  const octx = overlay.getContext('2d')!
  const stage = { w: 0, h: 0, dpr: 1 }
  let resized = false
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    stage.w = window.innerWidth
    stage.h = window.innerHeight
    stage.dpr = dpr
    sky = bakeSky(stage.w, stage.h, dpr, seed)
    if (gl) {
      gl.resize(stage.w, stage.h, dpr)
      gl.setBackground(sky)
    } else {
      // without GL the canvas still has to cover the screen: it is the one that takes the pointer
      canvas.style.width = stage.w + 'px'
      canvas.style.height = stage.h + 'px'
    }
    sizeFallback()
    overlay.width = Math.round(stage.w * dpr)
    overlay.height = Math.round(stage.h * dpr)
    overlay.style.width = stage.w + 'px'
    overlay.style.height = stage.h + 'px'
    overlayDirty = true
    resized = true
  }
  let overlayDirty = true
  resize()
  if (!startGL()) useFallback()
  // the AudioContext costs ~100 ms to create; do it while idle, not on the first touch
  const idle = (window as unknown as { requestIdleCallback?: (f: () => void) => number }).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 300))
  idle(() => audio.prewarm())
  window.addEventListener('resize', resize)
  const noMenu = (e: Event) => e.preventDefault()
  canvas.addEventListener('contextmenu', noMenu)

  const shake = new Shake(22, 0, 1.8)
  const stop = new HitStop()
  let flashA = 0
  let flashC = [1, 1, 1]

  let items: Item[] = []
  const sparks: Spark[] = []
  let alive = 0
  let wave = 0
  let waveTime = 0
  let eatenWave = 0
  const ateWave = GROUP_KEYS.map(() => 0)
  let peakData: Record<string, number> | null = null
  let snapAt = 0
  let snapN = 0
  let waveN = 1
  let clearAt = -1
  let banner = { text: '', sub: '', t: 0, rate: 0.75 }
  let gw = { r: 0, a: 0 } // gravitational wave after a clear

  const m0 = () => Math.min(stage.w, stage.h)
  const R0 = () => clamp(m0() * 0.05, 18, 30)
  const hole = { x: 0, y: 0, tx: 0, ty: 0, r: 0, vr: 0, pulse: 0, active: false, heat: 0, disk: 0, scale: 1, sv: 0 }
  hole.x = hole.tx = stage.w / 2
  hole.y = hole.ty = stage.h * 0.46
  hole.r = R0()
  let started = false
  let step = 0
  let lastEat = -1
  let lastNote = -1
  let time = 0
  let hudLine = ''
  let hum: Riser | null = null
  let touchHeld = false

  // the burp
  // ?item= (dev; and with ?portal=1, so the portal check on the live host can reach the sock)
  const forced = DEV || q.get('portal') === '1' ? (q.get('item') as ReturnId | null) : null
  const order = RETURNS.map((r) => r.id).sort(() => rnd() - 0.5)
  let orderI = 0
  let clears = 0
  let burp: { at: number; item: Item | null; ejected: boolean; cap: string; capT: number; id: ReturnId } | null = null

  const spawnWave = () => {
    const { w, h } = stage
    const m = m0()
    const base = clamp(m * 0.104, 38, 58)
    const gap = base * 1.04
    const cols = Math.max(4, Math.round(w / gap))
    const rows = Math.max(4, Math.round(h / gap))
    const cw = w / cols
    const ch = h / rows
    const cx = w / 2
    const cy = h / 2
    const keep = R0() * 4.4
    const totalW = MESS.reduce((s, e) => s + e.w, 0)
    const pick = () => {
      let r = rnd() * totalW
      for (const e of MESS) if ((r -= e.w) <= 0) return e
      return MESS[0]
    }
    const maxD = Math.hypot(cx, cy)
    const next: Item[] = []
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const x = (i + 0.5 + rr(-0.32, 0.32)) * cw
        const y = (j + 0.5 + rr(-0.32, 0.32)) * ch
        if (Math.hypot(x - hole.x, y - hole.y) < keep) continue
        const e = pick()
        next.push(mk(x, y, base * e.s * rr(0.86, 1.12), e.k, (Math.hypot(x - cx, y - cy) / maxD) * 0.45))
      }
    // a returned item stays for the next wave
    for (const it of items) if (it.ret && it.state === 0) next.push(it)
    items = next
    alive = items.length
    waveN = alive
    resized = false
    eatenWave = 0
    ateWave.fill(0)
    waveTime = 0
    wave++
  }
  const mk = (x: number, y: number, size: number, k: number, appear: number): Item => ({
    x,
    y,
    hx: x,
    hy: y,
    vx: 0,
    vy: 0,
    size,
    k,
    phase: rr(0, 100),
    rot: rr(-0.6, 0.6),
    spin: rr(-0.25, 0.25),
    appear,
    state: 0,
    pr: 0,
    pa: 0,
    vr: 0,
    ret: null,
    land: -1,
  })

  const press = (x: number, y: number, mouse: boolean) => {
    audio.unlock()
    act('drag')
    if (!started) {
      started = true
      onFirst()
    }
    hole.tx = x
    hole.ty = y
    touchHeld = !mouse
    hole.active = true
  }
  const onDown = (e: PointerEvent) => {
    canvas.setPointerCapture?.(e.pointerId)
    press(e.clientX, e.clientY, e.pointerType === 'mouse')
  }
  const onMove = (e: PointerEvent) => {
    hole.tx = e.clientX
    hole.ty = e.clientY
    if (e.pointerType === 'mouse') hole.active = true
  }
  const release = () => {
    hole.active = false
    touchHeld = false
    hum?.stop()
    hum = null
  }
  const onUp = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') release()
  }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onUp)

  const spark = (x: number, y: number, vx: number, vy: number, life: number, size: number, r: number, g: number, b: number) => {
    if (sparks.length > 900) sparks.shift()
    sparks.push({ x, y, vx, vy, life, max: life, size, r, g, b })
  }

  const eat = (it: Item) => {
    it.state = 2
    act('eat')
    alive--
    eatenWave++
    if (!it.ret && GROUP[it.k] !== undefined) ateWave[GROUP[it.k]]++
    hole.pulse = 1
    hole.heat = Math.min(1, hole.heat + 0.12)
    step = time - lastEat < 0.4 ? step + 1 : 0
    lastEat = time
    // a short flare where it crossed the ring
    const a = Math.atan2(it.y - hole.y, it.x - hole.x)
    for (let k = 0; k < 3; k++) {
      const s = rr(60, 200)
      const aa = a + Math.PI / 2 + rr(-0.5, 0.5)
      spark(it.x, it.y, Math.cos(aa) * s, Math.sin(aa) * s, rr(0.2, 0.4), rr(5, 9), 1, rr(0.6, 0.85), rr(0.3, 0.5))
    }
    if (it.ret) {
      audio.chime(pentaFreq(step % 20, 165), 0.18, (it.x / stage.w) * 1.6 - 0.8)
      haptic(12)
      track('void_return_eaten', { item: it.ret })
    } else if (time - lastNote > 0.028) {
      lastNote = time
      const s = step % 20
      audio.chime(pentaFreq(s, 330), 0.12 + Math.min(0.08, step * 0.003), (it.x / stage.w) * 1.6 - 0.8)
      if (step % 6 === 5) haptic(6)
    }
    shake.add(0.014)
  }

  const clear = () => {
    const t = waveTime
    clears++
    act('clear')
    stop.trigger(55)
    flashA = 0.3
    flashC = [1, 0.85, 0.7]
    shake.add(0.65)
    haptic([30, 20, 80])
    audio.chord([pentaFreq(5, 262), pentaFreq(7, 262), pentaFreq(8, 262), pentaFreq(10, 262), pentaFreq(12, 262)], 1.5, 0.12, 0.04)
    audio.subDrop(0.5)
    gw = { r: hole.r, a: 1 }
    const willBurp = forced !== null || clears === 1 || clears % 2 === 1
    banner = { text: 'CLEAR!', sub: t < 5 ? vt('void_fast', { t: t.toFixed(2) }) : `${t.toFixed(2)}s`, t: 1, rate: willBurp ? 1.6 : 0.75 }
    if (willBurp) {
      const id = forced ?? order[orderI++ % order.length]
      burp = { at: time + 0.5, item: null, ejected: false, cap: '', capT: 0, id }
      clearAt = time + 3.2
    } else {
      for (let k = 0; k < 160; k++) {
        const a = rr(0, Math.PI * 2)
        const s = rr(200, 1100)
        spark(hole.x, hole.y, Math.cos(a) * s, Math.sin(a) * s, rr(0.5, 1.1), rr(5, 12), 1, rr(0.55, 0.9), rr(0.25, 0.6))
      }
      clearAt = time + 0.8
    }
    track('wave_clear', { wave, seconds: Math.round(t * 10) / 10 })
    peakData = { s: Math.round(t * 10) / 10, back: 0 }
    GROUP_KEYS.forEach((k, i) => (peakData![k] = ateWave[i]))
    // a burp to come: the picture waits for the thing it gives back
    if (!willBurp) snapAt = time + 0.05
    stats.n = Math.min(stats.n ?? Infinity, Number(t.toFixed(2)))
  }

  const retSize = () => clamp(m0() * 0.16, 64, 88) * 1.6
  const ejectDist = () => Math.max(173, hole.vr * 2.3 + retSize() * 0.7)
  /** Where the returned item flies: up and away from the nearest edge, resting clear of the HUD and pills. */
  const ejectDir = () => {
    const { w, h } = stage
    // about 160 px clear of a small hole; further out when the hole is big
    const dist = ejectDist()
    const size = retSize()
    const top = 56 + size * 0.6 + 46 // HUD plus two caption lines
    const bottom = h - 96 - size * 0.6 - 46 // pills plus two caption lines
    let best = -Math.PI / 2
    let bestScore = -Infinity
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2
      const ex = hole.x + Math.cos(a) * dist
      const ey = hole.y + Math.sin(a) * dist
      const inside = Math.min(ex - size, w - size - ex, ey - top, bottom - ey)
      const score = (inside > 0 ? 0 : inside * 10) - Math.sin(a) * 40 + Math.cos(a) * ((w / 2 - hole.x) / w) * 60
      if (score > bestScore) {
        bestScore = score
        best = a
      }
    }
    return best
  }

  const update = (dt: number) => {
    time += dt
    if (items.length === 0 || (resized && clearAt < 0 && eatenWave === 0)) spawnWave()
    if (clearAt > 0 && time >= clearAt) {
      clearAt = -1
      spawnWave()
    }
    if (clearAt < 0 && eatenWave > 0) waveTime += dt

    const k = 1 - Math.pow(0.000001, dt)
    hole.x += (hole.tx - hole.x) * k
    hole.y += (hole.ty - hole.y) * k
    const target = R0() * (1 + 1.75 * Math.sqrt(eatenWave / Math.max(1, waveN)))
    hole.r += (target - hole.r) * (1 - Math.pow(0.02, dt))
    // what you see grows a little less than what it reaches, so a full hole still fits a phone
    hole.vr = R0() + (hole.r - R0()) * 0.72
    hole.pulse = Math.max(0, hole.pulse - dt * 6)
    hole.heat = Math.max(0, hole.heat - dt * 0.9)
    hole.disk += dt * (1 + Math.min(2.5, step * 0.12) + hole.heat)
    if (touchHeld && !hum && audio.ctx?.state === 'running') hum = audio.hum()
    hum?.set(clamp(step / 30, 0, 1))
    // burp spring: swell, snap small, spring back
    if (burp) {
      const bt = time - burp.at
      if (bt >= 0 && bt < 0.2) {
        const e = bt / 0.2
        hole.scale = 1 + 0.15 * (1 - (1 - e) * (1 - e))
        hole.sv = 0
      } else if (bt >= 0.2) {
        if (!burp.ejected) {
          burp.ejected = true
          hole.scale = 0.9
          hole.sv = 0
          const a = ejectDir()
          const r = RETURNS.find((x) => x.id === burp!.id)!
          const it = mk(hole.x, hole.y, retSize(), r.k, 0)
          it.appear = -1
          // drag 0.95 per frame: travel = v0 / 60 / 0.05, so 520 px/s comes to rest about 173 px out
          const v0 = ejectDist() * 3
          it.vx = Math.cos(a) * v0
          it.vy = Math.sin(a) * v0
          // slow spin that settles near upright, so the thing is readable when it lands
          it.spin = 1.2
          it.rot = rr(-0.15, 0.15) - 1.2 / 2.4
          it.ret = r.id
          items.push(it)
          burp.item = it
          burp.cap = vt(r.key)
          audio.burp()
          haptic([40, 30, 20])
          shake.add(0.35)
          gw = { r: hole.r, a: 0.6 }
          track('void_return', { item: r.id })
          // the returned sock: a portal to silk (its pair is on a clothesline there), under the caption once it is read
          if (r.id === 'sock') offer('void', 'sock', () => (it.state === 0 && items.includes(it) ? [it.x, it.y + it.size * 0.55 + 4] : null), 3300)
          if (peakData) {
            peakData.back = RETURNS.indexOf(r) + 1
            snapAt = time + 0.45
          }
        }
        // damped spring k 260, c 12
        hole.sv += (-(hole.scale - 1) * 260 - hole.sv * 12) * dt
        hole.scale += hole.sv * dt
        if (burp.item && burp.item.state === 0) burp.capT += dt
        if (bt > 0.2 + 0.25 + 2.6 + 0.4 || !burp.item || burp.item.state !== 0) {
          if (bt > 0.3) {
            burp = null
            hole.scale = 1
          }
        }
      }
    }

    const R = hole.r * hole.scale
    const capR = hole.r * 3.6 + Math.min(60, step * 1.5)
    const canEat = hole.active && clearAt < 0

    for (const it of items) {
      if (it.state === 2) continue
      it.appear -= dt
      if (it.appear > 0) continue
      // only a returned item spins (and settles); the rest just sway, so nothing ends up upside down
      if (it.ret) it.rot += it.spin * dt
      if (it.state === 0) {
        if (it.vx || it.vy) {
          // ejected: drag 0.95 per frame, slow spin that settles
          const d = Math.pow(0.95, dt * 60)
          it.vx *= d
          it.vy *= d
          it.hx += it.vx * dt
          it.hy += it.vy * dt
          it.spin *= Math.exp(-2.4 * dt)
          if (Math.abs(it.vx) + Math.abs(it.vy) < 30) {
            it.vx = it.vy = it.spin = 0
            it.land = time
            haptic(8)
          }
        }
        it.x = it.hx + Math.sin(time * 0.6 + it.phase) * 2.2
        it.y = it.hy + Math.cos(time * 0.5 + it.phase * 1.3) * 2.2
        // a returned item flies and then lies untouchable for 6 s (time to read it, and for the sock's bubble)
        if (canEat && !(it.ret && (it.land < 0 || time - it.land < 6))) {
          const dx = it.x - hole.x
          const dy = it.y - hole.y
          const d = Math.hypot(dx, dy)
          if (d < capR + it.size * 0.2) {
            it.state = 1
            it.pr = d
            it.pa = Math.atan2(dy, dx)
          }
        }
      } else {
        const prev = it.pr
        it.pa += dt * clamp(900 / (it.pr + 20), 3, 26)
        it.pr = it.pr * Math.pow(0.02, dt) - 260 * dt
        it.vr = dt > 0 ? (it.pr - prev) / dt : it.vr
        it.x = hole.x + Math.cos(it.pa) * it.pr
        it.y = hole.y + Math.sin(it.pa) * it.pr
        if (it.pr < R * 0.55) eat(it)
      }
    }
    if (alive <= 0 && clearAt < 0 && items.length) clear()

    let sj = 0
    const sd = Math.pow(0.94, dt * 60)
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i]
      s.life -= dt
      if (s.life <= 0) continue
      s.vx *= sd
      s.vy *= sd
      s.x += s.vx * dt
      s.y += s.vy * dt
      sparks[sj++] = s
    }
    sparks.length = sj
    if (gw.a > 0) {
      gw.r += dt * 900
      gw.a = Math.max(0, gw.a - dt * 0.8)
    }
    banner.t = Math.max(0, banner.t - dt * banner.rate)
    flashA = Math.max(0, flashA - dt * 4)
    shake.update(dt)
  }

  // ---------- drawing ----------
  let G!: Renderer
  const drawIdle = (it: Item, t: number, capR: number, R: number, k = 1) => {
    let x = it.x
    let y = it.y
    let s = it.size * k
    const born = -it.appear
    if (born < 0.35) s *= Math.max(0, easeOutBack(born / 0.35))
    if (s <= 0.5) return
    let dx = hole.x - x
    let dy = hole.y - y
    const d = Math.hypot(dx, dy) + 1e-3
    dx /= d
    dy /= d
    // nervous near the hole: lean in and tremble
    const near = hole.active ? clamp(1 - (d - capR) / 140, 0, 1) : 0
    const j = near * 2.4
    x += Math.sin(t * 17 + it.phase) * j + dx * near * 8
    y += Math.cos(t * 19 + it.phase * 1.3) * j + dy * near * 8
    // weak lensing: images stretch along the tangent, squash along the radius
    const g = 0.28 * clamp(Math.pow((capR * 1.05) / d, 2), 0, 1)
    const rot = it.rot + (it.ret ? 0 : Math.sin(t * 0.5 + it.phase) * 0.12)
    const c = Math.cos(rot)
    const sn = Math.sin(rot)
    const hw = s / 2
    const uv = UV[it.k]
    // warm light from the disk, per corner so the side facing the hole is brighter
    const Lr = R * 3
    const i0 = G.nv
    if (!G.room(4, 6)) return
    for (let ci = 0; ci < 4; ci++) {
      const cx = CX[ci]
      const cy = CY[ci]
      const u = uv[CU[ci]]
      const v = uv[CV[ci]]
      let ox = (cx * c - cy * sn) * hw
      let oy = (cx * sn + cy * c) * hw
      // shear about the centre: n = toward hole, t = tangent
      const on = ox * dx + oy * dy
      const ot = -ox * dy + oy * dx
      const on2 = on * (1 - g * 0.5)
      const ot2 = ot * (1 + g)
      ox = on2 * dx - ot2 * dy
      oy = on2 * dy + ot2 * dx
      const px = x + ox
      const py = y + oy
      const dd = Math.hypot(px - hole.x, py - hole.y)
      const L = (0.18 + hole.heat * 0.35) * (Lr * Lr) / (dd * dd + Lr * Lr)
      G.vert(px, py, u, v, 1, 1, 1, 1, 0, L)
    }
    G.tri(i0, i0 + 1, i0 + 2)
    G.tri(i0, i0 + 2, i0 + 3)
  }

  /** A captured item as a noodle along its spiral (spaghettification). */
  const NA = 8
  const NC = 2
  const drawNoodle = (it: Item, capR: number, R: number) => {
    const kk = 1 - clamp(it.pr / capR, 0, 1)
    const along = 1 + 2.2 * kk * kk
    const across = 1 - 0.55 * kk
    const s = it.size * clamp(0.55 + it.pr / (capR * 1.4), 0.6, 1)
    const L = s * along
    const W = s * across
    const hot = 0.6 * kk + 0.25 * clamp(1 - (it.pr - R) / (R * 1.2), 0, 1)
    const uv = UV[it.k]
    // rotation of the sprite relative to the direction of travel; settles to 0 as it stretches
    const travel = it.pa + Math.PI / 2
    let rel = it.rot - travel
    rel = Math.atan2(Math.sin(rel), Math.cos(rel)) * (1 - kk) * (1 - kk)
    const rc = Math.cos(rel)
    const rs = Math.sin(rel)
    const omega = clamp(900 / (it.pr + 20), 3, 26)
    const pitch = clamp(it.vr / (omega * Math.max(it.pr, 1)), -1.5, 0)
    if (!G.room((NA + 1) * (NC + 1), NA * NC * 6)) return
    const base = G.nv
    const Lr = R * 3
    for (let a = 0; a <= NA; a++)
      for (let b = 0; b <= NC; b++) {
        const sx = a / NA - 0.5
        const sy = b / NC - 0.5
        // sprite space -> (along, across), rotated by rel
        const al = (sx * rc - sy * rs) * L
        const ac = (sx * rs + sy * rc) * W
        const th = it.pa + al / Math.max(it.pr, 4)
        const r = Math.max(R * 0.3, it.pr + al * pitch - ac)
        const px = hole.x + Math.cos(th) * r
        const py = hole.y + Math.sin(th) * r
        const lt = (0.25 + hole.heat * 0.35) * (Lr * Lr) / (r * r + Lr * Lr)
        // each vertex dims and reddens as it nears the horizon, so the head of the noodle goes first
        const fade = clamp((r - R * 0.98) / (R * 0.45), 0, 1)
        G.vert(px, py, uv[0] + (uv[2] - uv[0]) * (sx + 0.5), uv[1] + (uv[3] - uv[1]) * (sy + 0.5), 1, 0.55 + 0.45 * fade, 0.35 + 0.65 * fade, fade, hot, lt)
      }
    for (let a = 0; a < NA; a++)
      for (let b = 0; b < NC; b++) {
        const i = base + a * (NC + 1) + b
        G.tri(i, i + NC + 1, i + NC + 2)
        G.tri(i, i + NC + 2, i + 1)
      }
  }

  const draw = (now: number) => {
    const { w, h } = stage
    const t = now / 1000
    // shake offset (translate only; GL pass and sprites move together)
    const tr = shake.trauma * shake.trauma
    const n = (k: number) => Math.sin(now * 0.07 * k + k) * Math.cos(now * 0.031 * k * 1.7)
    const ox = tr > 0 ? shake.maxPx * tr * n(13) : 0
    const oy = tr > 0 ? shake.maxPx * tr * n(29) : 0
    const line = `${alive} · ${waveTime.toFixed(1)}s`
    if (hud && line !== hudLine) hud.textContent = hudLine = line
    if (!gl) {
      if (fctx) draw2D(fctx, ox, oy)
      drawOverlay()
      return
    }
    G = gl
    gl.off[0] = ox
    gl.off[1] = oy

    const R = hole.vr * hole.scale * (1 + hole.pulse * 0.08)
    gl.hole({ x: hole.x, y: hole.y, R, t: hole.disk, on: 1, heat: clamp(hole.heat + Math.min(0.5, step * 0.02), 0, 1), waveR: gw.r, waveA: gw.a })

    const capR = hole.r * 3.6
    // glow behind a returned item so a dark thing still reads on the dark sky
    for (const it of items)
      if (it.ret && it.state === 0 && it.appear <= 0) {
        const s = it.size * 1.25
        gl.quadRot(it.x, it.y, s, s, 1, 0, DOT_UV, 0.25, 0.55, 0.65, 0.55)
      }
    gl.flush(true)
    for (const it of items) if (it.state === 0 && it.appear <= 0) drawIdle(it, t, capR, R, landScale(it))
    for (const it of items) if (it.state === 1) drawNoodle(it, capR, R)
    gl.flush(false)
    for (const s of sparks) {
      const f = s.life / s.max
      const z = s.size * (0.4 + 0.6 * f)
      gl.quadRot(s.x, s.y, z, z, 1, 0, DOT_UV, s.r * f, s.g * f, s.b * f, 0)
    }
    if (flashA > 0.01) {
      gl.off[0] = gl.off[1] = 0
      gl.quadRot(w / 2, h / 2, w, h, 1, 0, WHITE_UV, flashC[0] * flashA, flashC[1] * flashA, flashC[2] * flashA, 0)
    }
    gl.flush(true)

    drawOverlay()
  }

  /** Little boing when a returned item comes to rest. */
  const landScale = (it: Item) => {
    if (it.land < 0) return 1
    const t = time - it.land
    return t > 0.8 ? 1 : 1 + 0.16 * Math.exp(-5 * t) * Math.sin(t * 22)
  }

  /** Canvas 2D picture for when WebGL is missing or lost: a black disc in a soft ring, items scaling into it. */
  const draw2D = (c: CanvasRenderingContext2D, ox: number, oy: number) => {
    const { w, h, dpr } = stage
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    c.globalAlpha = 1
    c.globalCompositeOperation = 'source-over'
    if (sky) c.drawImage(sky, 0, 0, w, h)
    const R = hole.vr * hole.scale * (1 + hole.pulse * 0.08)
    const hx = hole.x + ox
    const hy = hole.y + oy
    c.globalCompositeOperation = 'lighter'
    const g = c.createRadialGradient(hx, hy, R * 0.9, hx, hy, R * 3.6)
    g.addColorStop(0, `rgba(255,190,120,${0.7 + hole.heat * 0.3})`)
    g.addColorStop(0.12, 'rgba(255,140,60,0.35)')
    g.addColorStop(0.45, 'rgba(160,70,40,0.12)')
    g.addColorStop(1, 'rgba(80,40,120,0)')
    c.fillStyle = g
    c.beginPath()
    c.arc(hx, hy, R * 3.6, 0, Math.PI * 2)
    c.fill()
    c.globalCompositeOperation = 'source-over'
    c.fillStyle = '#000'
    c.beginPath()
    c.arc(hx, hy, R, 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = 'rgba(255,226,176,0.85)'
    c.lineWidth = 1.5
    c.stroke()
    const capR = hole.r * 3.6
    const sprite = (it: Item, x: number, y: number, a: number, sx: number, sy: number, alpha: number) => {
      const uv = UV[it.k]
      const cs = Math.cos(a)
      const sn = Math.sin(a)
      c.globalAlpha = alpha
      c.setTransform(dpr * cs * sx, dpr * sn * sx, -dpr * sn * sy, dpr * cs * sy, dpr * (x + ox), dpr * (y + oy))
      c.drawImage(atlas, uv[0] * ATLAS, uv[1] * ATLAS, (uv[2] - uv[0]) * ATLAS, (uv[3] - uv[1]) * ATLAS, -0.5, -0.5, 1, 1)
    }
    for (const it of items) {
      if (it.state === 2 || it.appear > 0) continue
      if (it.state === 0) {
        let s = it.size * landScale(it)
        const born = -it.appear
        if (born < 0.35) s *= Math.max(0, easeOutBack(born / 0.35))
        if (s > 0.5) sprite(it, it.x, it.y, it.rot, s, s, 1)
      } else {
        // scale into the centre, stretched along the orbit
        const kk = 1 - clamp(it.pr / capR, 0, 1)
        const s = it.size * clamp(it.pr / (capR * 0.9), 0.15, 1)
        sprite(it, it.x, it.y, it.pa + Math.PI / 2, s * (1 + 1.2 * kk * kk), s * (1 - 0.5 * kk), clamp((it.pr - R * 0.9) / (R * 0.5), 0, 1))
      }
    }
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    c.globalAlpha = 1
    c.globalCompositeOperation = 'lighter'
    for (const s of sparks) {
      const f = s.life / s.max
      c.fillStyle = `rgba(${(s.r * 255) | 0},${(s.g * 255) | 0},${(s.b * 255) | 0},${f})`
      const z = s.size * 0.4 * (0.4 + 0.6 * f)
      c.fillRect(s.x + ox - z, s.y + oy - z, z * 2, z * 2)
    }
    c.globalCompositeOperation = 'source-over'
    if (flashA > 0.01) {
      c.fillStyle = `rgba(${flashC.map((v) => (v * 255) | 0).join(',')},${flashA})`
      c.fillRect(0, 0, w, h)
    }
  }

  const drawOverlay = () => {
    const { w, h, dpr } = stage
    const cap = burp && burp.item && burp.capT > 0 ? burp : null
    const show = banner.t > 0 || cap
    if (!show && !overlayDirty) return
    octx.setTransform(dpr, 0, 0, dpr, 0, 0)
    octx.clearRect(0, 0, w, h)
    overlayDirty = !!show
    if (banner.t > 0) {
      const m = Math.min(w, h)
      const s = 0.8 + 0.4 * easeOutBack(clamp((1 - banner.t) * 5, 0, 1))
      octx.save()
      octx.translate(w / 2, h * 0.3)
      octx.scale(s, s)
      octx.globalAlpha = Math.min(1, banner.t * 2.5)
      octx.textAlign = 'center'
      octx.textBaseline = 'middle'
      octx.font = `900 ${Math.round(m * 0.17)}px system-ui, sans-serif`
      octx.fillStyle = '#C2410C'
      octx.fillText(banner.text, 4, 5)
      octx.fillStyle = '#FFF4E6'
      octx.fillText(banner.text, 0, 0)
      octx.font = `700 ${Math.round(m * 0.045)}px ${FONT}`
      octx.fillStyle = '#FFD7A8'
      octx.fillText(banner.sub, 0, m * 0.12)
      octx.restore()
    }
    if (cap && cap.item) {
      const it = cap.item
      const fadeIn = clamp(cap.capT / 0.25, 0, 1)
      const fadeOut = clamp((0.25 + 2.6 + 0.4 - cap.capT) / 0.4, 0, 1)
      const a = 0.9 * fadeIn * fadeOut
      if (a > 0) {
        octx.save()
        octx.font = `600 ${w >= 700 ? 17 : 15}px ${FONT}`
        octx.textAlign = 'center'
        octx.textBaseline = 'top'
        const maxW = Math.min(w - 32, 300)
        const lines = wrap(octx, cap.cap, maxW)
        const lh = w >= 700 ? 23 : 21
        // caption on the side of the item away from the hole, so it never sits on the disk
        const below = it.y + it.size * 0.55 + 4
        const above = it.y - it.size * 0.55 - 4 - lines.length * lh
        let y = hole.y > it.y ? above : below
        if (y < 56) y = below
        if (y + lines.length * lh > h - 84) y = above
        const x = clamp(it.x, maxW / 2 + 12, w - maxW / 2 - 12)
        octx.globalAlpha = a
        octx.shadowColor = 'rgba(0,0,0,0.7)'
        octx.shadowBlur = 6
        octx.fillStyle = '#A5F3FC'
        lines.forEach((l, i) => octx.fillText(l, x, y + i * lh))
        octx.restore()
      }
    }
  }

  let frozen = false
  let simNow = 0
  const cpuLog: number[] = []
  const stepSim = (dt: number) => {
    update(dt)
  }

  if (DEV) {
    ;(window as unknown as Record<string, unknown>).__toy = {
      seed,
      freeze: () => (frozen = true),
      resume: () => (frozen = false),
      advance: (dt: number) => {
        // fixed 1/60 sub-steps so a long advance behaves like real frames
        let left = dt
        while (left > 1e-6) {
          const d = Math.min(1 / 60, left)
          stepSim(d)
          left -= d
        }
        simNow += dt * 1000
        draw(simNow)
      },
      clearNow: () => {
        for (const it of items) if (it.state !== 2 && !it.ret) {
          it.state = 2
          alive--
          eatenWave++
        }
        waveTime = Math.max(waveTime, 3.42)
        if (alive <= 0 && clearAt < 0) clear()
      },
      press: (x: number, y: number) => press(x, y, false),
      move: (x: number, y: number) => {
        hole.tx = x
        hole.ty = y
      },
      release,
      cpu: () => {
        const a = cpuLog.splice(0)
        a.sort((x, y) => y - x)
        return { n: a.length, avg: a.reduce((s, v) => s + v, 0) / Math.max(1, a.length), p99: a[Math.floor(a.length * 0.01)], max: a[0] }
      },
      state: () => ({ alive, wave, captured: items.filter((i) => i.state === 1).length, hole: { ...hole }, burp: burp ? { id: burp.id, capT: burp.capT } : null }),
      /** a returned item still out on the field (tests: where the sock lies) */
      ret: () => items.filter((i) => i.ret && i.state === 0).map((i) => ({ id: i.ret, x: i.x, y: i.y })),
    }
  }

  /** The card's picture, from the frame just drawn on the GL (or fallback) canvas. */
  const peakSnap = () => {
    const data = peakData!
    snapAt = 0
    peakData = null
    let snap: HTMLCanvasElement | null = null
    // a picture only on the clears that get a card (the share cadence: 1st, 5th, 20th, 50th)
    if ([1, 5, 20, 50].includes(++snapN)) try {
      const src = fb && !gl ? fb : canvas
      const k = Math.min(1, 1000 / src.width)
      snap = document.createElement('canvas')
      snap.width = Math.round(src.width * k)
      snap.height = Math.round(src.height * k)
      const c = snap.getContext('2d')!
      // the overlay's caption would be cut by the card's crop; the clutter itself is on this canvas
      c.drawImage(src, 0, 0, snap.width, snap.height)
    } catch {
      snap = null
    }
    onPeak?.(snap, data)
  }
  const stopLoop = runLoop((dt, now) => {
    if (frozen) {
      draw(simNow)
      return
    }
    simNow = now
    const t0 = DEV ? performance.now() : 0
    if (!stop.active) stepSim(dt)
    draw(now)
    if (snapAt && time >= snapAt && peakData) peakSnap()
    if (DEV) cpuLog.push(performance.now() - t0)
  })

  return () => {
    stopLoop()
    hum?.stop()
    window.removeEventListener('resize', resize)
    canvas.removeEventListener('contextmenu', noMenu)
    canvas.removeEventListener('webglcontextlost', onLost)
    canvas.removeEventListener('webglcontextrestored', onRestored)
    fb?.remove()
    canvas.removeEventListener('pointerdown', onDown)
    canvas.removeEventListener('pointermove', onMove)
    canvas.removeEventListener('pointerup', onUp)
    canvas.removeEventListener('pointercancel', onUp)
  }
}

function wrap(c: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  if (c.measureText(text).width <= maxW) return [text]
  // one sentence per line first (the deadpan beat), then words / CJK punctuation inside a sentence
  const out: string[] = []
  for (const sentence of text.split(/(?<=[.。!！?？])\s*/).filter(Boolean)) {
    if (c.measureText(sentence).width <= maxW) {
      out.push(sentence)
      continue
    }
    let cur = ''
    for (const p of sentence.split(/(?<=[、，：:, ])/)) {
      if (cur && c.measureText(cur + p).width > maxW) {
        out.push(cur.trim())
        cur = p
      } else cur += p
    }
    if (cur) out.push(cur.trim())
  }
  return out
}
