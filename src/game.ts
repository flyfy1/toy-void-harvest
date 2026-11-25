import { audio, pentaFreq } from './engine/AudioEngine'
import { track } from './analytics'
import { stats } from './share'
import { t as tr } from './i18n'
import { Flash, HitStop, Particles, Shake, clamp, easeOutBack, haptic, rand, runLoop, setupCanvas } from './engine/juice'

const COLORS = ['#ff2d75', '#ffb020', '#f5ff3b', '#3bff8f', '#22d3ee', '#6d7bff', '#c45bff']
const HUES = [340, 38, 63, 148, 188, 233, 280]
const PATTERNS = ['grid', 'sunflower', 'rings', 'rainbow', 'diamond'] as const

interface Item {
  x: number
  y: number
  hx: number
  hy: number
  size: number
  shape: number // 0 square, 1 circle, 2 triangle
  color: number
  phase: number
  rot: number
  spin: number
  appear: number // seconds until it pops in (can be negative = visible)
  state: 0 | 1 | 2 // idle, captured, eaten
  pr: number // polar radius while captured
  pa: number // polar angle while captured
}

export function startGame(canvas: HTMLCanvasElement, onFirst: () => void, hud?: HTMLElement | null): () => void {
  let resized = false
  const { stage, dispose } = setupCanvas(canvas, () => (resized = true))
  const shake = new Shake(22, 0.03, 1.8)
  const stop = new HitStop()
  const flash = new Flash()
  const parts = new Particles(2500)

  let items: Item[] = []
  let alive = 0
  let wave = 0
  let waveTime = 0
  let eatenWave = 0
  let clearAt = -1 // time when next wave spawns
  let banner = { text: '', sub: '', t: 0 }
  let rings: { r: number; v: number; life: number; hue: number }[] = []

  const hole = { x: 0, y: 0, tx: 0, ty: 0, r: 18, pulse: 0, active: false, spin: 0 }
  let started = false
  let step = 0
  let lastEat = -1
  let lastNote = -1
  let time = 0
  let hudLine = ''

  const spawnWave = () => {
    const { w, h } = stage
    const area = w * h
    const n = Math.round(clamp(area / 2400, 420, 900) * (1 + Math.min(wave, 5) * 0.06))
    const pat = PATTERNS[wave % PATTERNS.length]
    const pad = 14
    const pts: { x: number; y: number; c: number }[] = []
    const cx = w / 2
    const cy = h / 2
    if (pat === 'grid' || pat === 'rainbow' || pat === 'diamond') {
      const cell = Math.sqrt(((w - pad * 2) * (h - pad * 2)) / n)
      const cols = Math.ceil((w - pad * 2) / cell)
      const rows = Math.ceil((h - pad * 2) / cell)
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          let x = pad + (i + 0.5) * cell
          const y = pad + (j + 0.5) * cell
          if (pat === 'diamond' && j % 2) x += cell / 2
          const jit = pat === 'grid' ? cell * 0.3 : 0
          const c = pat === 'rainbow' ? Math.floor((i / cols) * COLORS.length) : pat === 'diamond' ? (Math.abs(i - cols / 2) + Math.abs(j - rows / 2)) % COLORS.length | 0 : (Math.random() * COLORS.length) | 0
          if (x < w - pad / 2) pts.push({ x: x + rand(-jit, jit), y: y + rand(-jit, jit), c })
        }
    } else if (pat === 'sunflower') {
      const R = Math.hypot(w, h) / 2
      const ga = Math.PI * (3 - Math.sqrt(5))
      for (let k = 0; pts.length < n && k < n * 3; k++) {
        const r = R * Math.sqrt(k / (n * 1.25))
        const x = cx + Math.cos(k * ga) * r
        const y = cy + Math.sin(k * ga) * r
        if (x > pad && x < w - pad && y > pad && y < h - pad) pts.push({ x, y, c: Math.floor(k / 13) % COLORS.length })
      }
    } else {
      const R = Math.hypot(w, h) / 2
      const gap = Math.sqrt((w * h) / n)
      for (let r = gap * 0.5, ring = 0; r < R; r += gap, ring++) {
        const m = Math.max(1, Math.round((2 * Math.PI * r) / gap))
        const off = rand(0, Math.PI)
        for (let k = 0; k < m; k++) {
          const a = off + (k / m) * Math.PI * 2
          const x = cx + Math.cos(a) * r
          const y = cy + Math.sin(a) * r
          if (x > pad && x < w - pad && y > pad && y < h - pad) pts.push({ x, y, c: ring % COLORS.length })
        }
      }
    }
    const maxD = Math.hypot(cx, cy)
    const base = clamp(Math.sqrt((w * h) / pts.length) * 0.42, 6, 16)
    items = pts.map((p) => ({
      x: p.x,
      y: p.y,
      hx: p.x,
      hy: p.y,
      size: base * rand(0.75, 1.15),
      shape: (Math.random() * 3) | 0,
      color: p.c,
      phase: rand(0, 100),
      rot: rand(0, Math.PI * 2),
      spin: rand(-2, 2),
      appear: (Math.hypot(p.x - cx, p.y - cy) / maxD) * 0.45,
      state: 0,
      pr: 0,
      pa: 0,
    }))
    alive = items.length
    resized = false
    eatenWave = 0
    waveTime = 0
    wave++
  }

  const onDown = (e: PointerEvent) => {
    audio.unlock()
    if (!started) {
      started = true
      onFirst()
    }
    canvas.setPointerCapture?.(e.pointerId)
    hole.tx = e.clientX
    hole.ty = e.clientY
    if (e.pointerType !== 'mouse') {
      hole.x = e.clientX
      hole.y = e.clientY
    }
    hole.active = true
  }
  const onMove = (e: PointerEvent) => {
    hole.tx = e.clientX
    hole.ty = e.clientY
    if (e.pointerType === 'mouse') {
      if (!hole.active) {
        hole.x = e.clientX
        hole.y = e.clientY
      }
      hole.active = true
    }
  }
  const onUp = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') hole.active = false
  }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onUp)

  const eat = (it: Item) => {
    it.state = 2
    alive--
    eatenWave++
    hole.pulse = 1
    step = time - lastEat < 0.4 ? step + 1 : 0
    lastEat = time
    for (let k = 0; k < 3; k++)
      parts.spawn({ x: it.x, y: it.y, vx: rand(-120, 120), vy: rand(-120, 120), life: 0.3, size: 3, hue: HUES[it.color], light: 70 })
    if (time - lastNote > 0.028) {
      lastNote = time
      const s = step % 20
      audio.chime(pentaFreq(s, 330), 0.12 + Math.min(0.08, step * 0.003), (it.x / stage.w) * 1.6 - 0.8)
      if (step % 6 === 5) haptic(6)
    }
    shake.add(0.012)
  }

  const clear = () => {
    const t = waveTime
    stop.trigger(55)
    flash.fire(0.3, '220,200,255')
    shake.add(0.65)
    haptic([30, 20, 80])
    audio.chord([pentaFreq(5, 262), pentaFreq(7, 262), pentaFreq(8, 262), pentaFreq(10, 262), pentaFreq(12, 262)], 1.5, 0.12, 0.04)
    audio.subDrop(0.5)
    for (let k = 0; k < 3; k++) rings.push({ r: 10, v: 900 + k * 600, life: 0.8 - k * 0.15, hue: 280 - k * 60 })
    parts.burst(hole.x, hole.y, 420, { speed: 1400, life: 1.2, size: 5 })
    banner = { text: 'CLEAR!', sub: t < 5 ? tr('void_fast', { t: t.toFixed(2) }) : `${t.toFixed(2)}s`, t: 1 }
    clearAt = time + 0.8
    track('wave_clear', { wave, seconds: Math.round(t * 10) / 10 })
    stats.n = Math.min(stats.n ?? Infinity, Number(t.toFixed(2)))
  }

  const update = (dt: number) => {
    time += dt
    if (items.length === 0 || (resized && clearAt < 0 && eatenWave === 0)) {
      spawnWave()
    }
    if (clearAt > 0 && time >= clearAt) {
      clearAt = -1
      spawnWave()
    }
    if (clearAt < 0 && eatenWave > 0) waveTime += dt

    // hole follows pointer with a little lag
    const k = 1 - Math.pow(0.000001, dt)
    hole.x += (hole.tx - hole.x) * k
    hole.y += (hole.ty - hole.y) * k
    hole.r = 16 + Math.sqrt(eatenWave) * 2.1
    hole.pulse = Math.max(0, hole.pulse - dt * 6)
    hole.spin += dt * (3 + Math.min(8, step * 0.3))
    const capR = hole.r * 3.6 + Math.min(60, step * 1.5)

    for (const it of items) {
      if (it.state === 2) continue
      it.appear -= dt
      if (it.appear > 0) continue
      it.rot += it.spin * dt
      if (it.state === 0) {
        if (hole.active && clearAt < 0) {
          const dx = it.x - hole.x
          const dy = it.y - hole.y
          const d = Math.hypot(dx, dy)
          if (d < capR) {
            it.state = 1
            it.pr = d
            it.pa = Math.atan2(dy, dx)
          }
        }
      } else {
        // spiral in
        it.pa += dt * clamp(900 / (it.pr + 20), 3, 26)
        it.pr = it.pr * Math.pow(0.02, dt) - 260 * dt
        it.x = hole.x + Math.cos(it.pa) * it.pr
        it.y = hole.y + Math.sin(it.pa) * it.pr
        if (it.pr < hole.r * 0.5) eat(it)
      }
    }
    if (alive === 0 && clearAt < 0 && items.length) clear()

    parts.update(dt)
    for (const r of rings) {
      r.r += r.v * dt
      r.life -= dt
    }
    rings = rings.filter((r) => r.life > 0)
    banner.t = Math.max(0, banner.t - dt * 0.75)
  }

  const draw = (now: number) => {
    const { ctx, w, h, dpr } = stage
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#07060f'
    ctx.fillRect(0, 0, w, h)
    ctx.save()
    shake.apply(ctx, w, h, now)

    // items, batched by colour
    const t = now / 1000
    const capR = hole.r * 3.6
    for (let c = 0; c < COLORS.length; c++) {
      ctx.beginPath()
      for (const it of items) {
        if (it.color !== c || it.state === 2 || it.appear > 0) continue
        let x = it.x
        let y = it.y
        let s = it.size
        const born = -it.appear
        if (born < 0.35) s *= Math.max(0, easeOutBack(born / 0.35))
        if (it.state === 0) {
          // nervous jitter, stronger near the hole
          const dx = hole.x - x
          const dy = hole.y - y
          const d = Math.hypot(dx, dy) + 1
          const near = hole.active ? clamp(1 - (d - capR) / 140, 0, 1) : 0
          const j = 1.2 + near * 3
          x += Math.sin(t * 17 + it.phase) * j + (dx / d) * near * 10
          y += Math.cos(t * 19 + it.phase * 1.3) * j + (dy / d) * near * 10
        } else {
          s *= clamp(it.pr / (hole.r * 3), 0.25, 1)
        }
        const r = s / 2
        if (it.shape === 1) {
          ctx.moveTo(x + r, y)
          ctx.arc(x, y, r, 0, Math.PI * 2)
        } else {
          const n = it.shape === 0 ? 4 : 3
          const rr = it.shape === 0 ? r * 1.35 : r * 1.5
          for (let v = 0; v < n; v++) {
            const a = it.rot + (v / n) * Math.PI * 2
            const px = x + Math.cos(a) * rr
            const py = y + Math.sin(a) * rr
            if (v === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.closePath()
        }
      }
      ctx.fillStyle = COLORS[c]
      ctx.fill()
    }

    // black hole
    if (hole.active || started) {
      const R = hole.r * (1 + hole.pulse * 0.15)
      ctx.globalCompositeOperation = 'lighter'
      const g = ctx.createRadialGradient(hole.x, hole.y, R * 0.8, hole.x, hole.y, R * 3.2)
      g.addColorStop(0, 'rgba(190,120,255,0.9)')
      g.addColorStop(0.25, 'rgba(120,80,255,0.35)')
      g.addColorStop(1, 'rgba(40,200,255,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(hole.x, hole.y, R * 3.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 2.5
      for (let k = 0; k < 3; k++) {
        ctx.strokeStyle = k === 1 ? 'rgba(80,230,255,0.85)' : 'rgba(230,180,255,0.8)'
        ctx.beginPath()
        const a = hole.spin * (1 + k * 0.4) + k * 2.1
        ctx.arc(hole.x, hole.y, R * (1.25 + k * 0.35), a, a + Math.PI * 0.9)
        ctx.stroke()
      }
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(hole.x, hole.y, R, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.lineWidth = 1.2
      ctx.stroke()
    }

    ctx.globalCompositeOperation = 'lighter'
    for (const r of rings) {
      ctx.strokeStyle = `hsla(${r.hue},100%,70%,${r.life})`
      ctx.lineWidth = 18 * r.life
      ctx.beginPath()
      ctx.arc(hole.x, hole.y, r.r, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'
    parts.draw(ctx)
    ctx.restore()

    // HUD: a DOM pill, written only when the text changes
    const line = `${alive} · ${waveTime.toFixed(1)}s`
    if (hud && line !== hudLine) hud.textContent = hudLine = line

    if (banner.t > 0) {
      const m = Math.min(w, h)
      const s = 0.8 + 0.4 * easeOutBack(clamp((1 - banner.t) * 5, 0, 1))
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.scale(s, s)
      ctx.globalAlpha = Math.min(1, banner.t * 2.5)
      ctx.textBaseline = 'middle'
      ctx.font = `900 ${Math.round(m * 0.17)}px system-ui, sans-serif`
      ctx.fillStyle = '#7c3aed'
      ctx.fillText(banner.text, 5, 5)
      ctx.fillStyle = '#fff'
      ctx.fillText(banner.text, 0, 0)
      ctx.font = `700 ${Math.round(m * 0.045)}px system-ui, sans-serif`
      ctx.fillStyle = '#a5f3fc'
      ctx.fillText(banner.sub, 0, m * 0.12)
      ctx.restore()
    }
    flash.draw(ctx, w, h)
  }

  const stopLoop = runLoop((dt, now) => {
    if (!stop.active) {
      update(dt)
      shake.update(dt)
      flash.update(dt)
    }
    draw(now)
  })

  return () => {
    stopLoop()
    dispose()
    canvas.removeEventListener('pointerdown', onDown)
    canvas.removeEventListener('pointermove', onMove)
    canvas.removeEventListener('pointerup', onUp)
    canvas.removeEventListener('pointercancel', onUp)
  }
}
