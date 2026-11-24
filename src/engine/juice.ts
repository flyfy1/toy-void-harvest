// Game-feel toolkit: canvas setup, loop, screen shake, hit-stop, flash, haptics, particles.

export interface Stage {
  ctx: CanvasRenderingContext2D
  w: number
  h: number
  dpr: number
}

/** Sizes the canvas to the window at devicePixelRatio (capped at 2) and keeps it in sync. */
export function setupCanvas(canvas: HTMLCanvasElement, onResize?: (s: Stage) => void): { stage: Stage; dispose: () => void } {
  const ctx = canvas.getContext('2d', { alpha: false })!
  const stage: Stage = { ctx, w: 0, h: 0, dpr: 1 }
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    stage.w = w
    stage.h = h
    stage.dpr = dpr
    onResize?.(stage)
  }
  resize()
  window.addEventListener('resize', resize)
  const noMenu = (e: Event) => e.preventDefault()
  canvas.addEventListener('contextmenu', noMenu)
  return {
    stage,
    dispose() {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('contextmenu', noMenu)
    },
  }
}

/** rAF loop. dt in seconds, clamped so a background tab doesn't explode physics. */
export function runLoop(fn: (dt: number, now: number) => void): () => void {
  let last = performance.now()
  let id = 0
  const tick = (now: number) => {
    const dt = Math.min(0.033, (now - last) / 1000)
    last = now
    fn(dt, now)
    id = requestAnimationFrame(tick)
  }
  id = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(id)
}

/** Trauma-based camera shake (offset ∝ trauma², trauma decays linearly). */
export class Shake {
  trauma = 0
  constructor(
    public maxPx = 26,
    public maxRot = 0.05,
    public decay = 1.6,
  ) {}
  add(t: number) {
    this.trauma = Math.min(1, this.trauma + t)
  }
  update(dt: number) {
    this.trauma = Math.max(0, this.trauma - this.decay * dt)
  }
  /** Apply to ctx (call after setTransform for dpr). */
  apply(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    const s = this.trauma * this.trauma
    if (s <= 0) return
    const n = (k: number) => Math.sin(t * 0.07 * k + k) * Math.cos(t * 0.031 * k * 1.7)
    const x = this.maxPx * s * n(13)
    const y = this.maxPx * s * n(29)
    const r = this.maxRot * s * n(41)
    ctx.translate(w / 2 + x, h / 2 + y)
    ctx.rotate(r)
    ctx.translate(-w / 2, -h / 2)
  }
}

/** Freezes simulation for a few ms on big impacts. */
export class HitStop {
  private until = 0
  trigger(ms: number) {
    this.until = Math.max(this.until, performance.now() + ms)
  }
  get active() {
    return performance.now() < this.until
  }
}

/** Full-screen flash overlay. */
export class Flash {
  a = 0
  color = '255,255,255'
  fire(a = 1, color = '255,255,255') {
    this.a = Math.max(this.a, a)
    this.color = color
  }
  update(dt: number) {
    this.a = Math.max(0, this.a - dt * 4)
  }
  draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (this.a <= 0.01) return
    ctx.fillStyle = `rgba(${this.color},${this.a})`
    ctx.fillRect(-50, -50, w + 100, h + 100)
  }
}

export function haptic(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* unsupported */
  }
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  hue: number
  light: number
  drag: number
  grav: number
}

/** Additive-blended square particles with a hard cap. */
export class Particles {
  list: Particle[] = []
  constructor(public cap = 2500) {}

  spawn(p: Partial<Particle> & { x: number; y: number }) {
    if (this.list.length >= this.cap) this.list.shift()
    this.list.push({ vx: 0, vy: 0, life: 1, size: 3, hue: 0, light: 60, drag: 0.96, grav: 0, ...p, max: p.life ?? 1 })
  }

  burst(x: number, y: number, n: number, o: { speed?: number; hue?: number | (() => number); life?: number; size?: number; grav?: number; drag?: number; light?: number } = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = (o.speed ?? 400) * (0.2 + Math.random() * 0.9)
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: (o.life ?? 0.8) * (0.5 + Math.random() * 0.7),
        size: (o.size ?? 3) * (0.5 + Math.random()),
        hue: typeof o.hue === 'function' ? o.hue() : (o.hue ?? Math.random() * 360),
        grav: o.grav ?? 0,
        drag: o.drag ?? 0.95,
        light: o.light ?? 62,
      })
    }
  }

  update(dt: number) {
    const k = dt * 60
    const L = this.list
    let j = 0
    for (let i = 0; i < L.length; i++) {
      const p = L[i]
      p.life -= dt
      if (p.life <= 0) continue
      const d = Math.pow(p.drag, k)
      p.vx *= d
      p.vy = p.vy * d + p.grav * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      L[j++] = p
    }
    L.length = j
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (const p of this.list) {
      const t = p.life / p.max
      ctx.globalAlpha = Math.min(1, t * 1.5)
      ctx.fillStyle = `hsl(${p.hue},100%,${p.light}%)`
      const s = p.size * (0.4 + 0.6 * t)
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s)
    }
    ctx.restore()
  }
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a)
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export const easeOutBack = (t: number) => {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}
