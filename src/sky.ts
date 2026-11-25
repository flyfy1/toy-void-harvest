// The sky the hole bends: faint nebula, a dust band and a few thousand stars, baked once per size.

export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function bakeSky(w: number, h: number, dpr: number, seed: number): HTMLCanvasElement {
  const cv = document.createElement('canvas')
  cv.width = Math.round(w * dpr)
  cv.height = Math.round(h * dpr)
  const c = cv.getContext('2d', { alpha: false })!
  const rnd = rng(seed * 977 + 3)
  c.scale(dpr, dpr)
  c.fillStyle = '#05040c'
  c.fillRect(0, 0, w, h)
  const m = Math.max(w, h)
  // nebula: soft blobs, mostly violet and teal, very low alpha
  c.globalCompositeOperation = 'lighter'
  const blobs: [number, number, number, string, number][] = [
    [0.18, 0.22, 0.55, '110,60,200', 0.16],
    [0.85, 0.7, 0.6, '40,110,170', 0.13],
    [0.65, 0.15, 0.35, '200,70,140', 0.07],
    [0.25, 0.85, 0.45, '90,50,170', 0.1],
    [0.55, 0.5, 0.3, '255,140,80', 0.035],
  ]
  for (const [bx, by, br, col, a] of blobs) {
    const x = bx * w + (rnd() - 0.5) * w * 0.1
    const y = by * h + (rnd() - 0.5) * h * 0.1
    const r = br * m
    const g = c.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(${col},${a})`)
    g.addColorStop(0.5, `rgba(${col},${a * 0.35})`)
    g.addColorStop(1, `rgba(${col},0)`)
    c.fillStyle = g
    c.fillRect(0, 0, w, h)
  }
  // a faint diagonal band of unresolved stars (the Milky Way look)
  c.save()
  c.translate(w / 2, h / 2)
  c.rotate(-0.55)
  for (let i = 0; i < 70; i++) {
    const x = (rnd() - 0.5) * m * 1.6
    const y = (rnd() - 0.5) * m * 0.16 * (1 + rnd())
    const r = m * (0.03 + rnd() * 0.07)
    const g = c.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(170,160,230,0.05)')
    g.addColorStop(1, 'rgba(170,160,230,0)')
    c.fillStyle = g
    c.fillRect(x - r, y - r, r * 2, r * 2)
  }
  c.restore()
  // stars: many dim ones, fewer bright ones with a soft halo
  const n = Math.round((w * h) / 380)
  for (let i = 0; i < n; i++) {
    const x = rnd() * w
    const y = rnd() * h
    const v = Math.pow(rnd(), 4.5)
    const tint = rnd()
    const col = tint < 0.15 ? '255,210,170' : tint < 0.4 ? '190,210,255' : '235,238,255'
    const r = 0.3 + v * 0.9
    c.fillStyle = `rgba(${col},${0.2 + v * 0.8})`
    c.beginPath()
    c.arc(x, y, r, 0, Math.PI * 2)
    c.fill()
    if (v > 0.7) {
      const g = c.createRadialGradient(x, y, 0, x, y, r * 6)
      g.addColorStop(0, `rgba(${col},0.22)`)
      g.addColorStop(1, `rgba(${col},0)`)
      c.fillStyle = g
      c.fillRect(x - r * 6, y - r * 6, r * 12, r * 12)
    }
  }
  return cv
}
