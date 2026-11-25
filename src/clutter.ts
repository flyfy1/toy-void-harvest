// Everyday clutter, drawn once into a texture atlas with Canvas 2D.
// Every sprite is designed in a 100 x 100 box centred on (50, 50); the cell is drawn at
// CELL device px so it stays sharp up to about 90 CSS px at dpr 2.
import { FONT, vt } from './voidStrings'

export const CELL = 192
export const GRID = 5 // 5 x 5 cells, atlas 960 -> padded to 1024 (power of two for mipmaps)
export const ATLAS = 1024

export const K = {
  SockA: 0,
  SockB: 1,
  SockC: 2,
  Receipt: 3,
  Keys: 4,
  Charger: 5,
  Bubble: 6,
  Email: 7,
  Monday: 8,
  Tie: 9,
  Bud: 10,
  Umbrella: 11,
  Dot: 12,
  White: 13,
  Count: 14,
} as const


/** Clutter the waves are made of, with spawn weights. */
export const MESS: { k: number; w: number; s: number }[] = [
  { k: K.SockA, w: 1.2, s: 1.0 },
  { k: K.SockB, w: 1.0, s: 1.0 },
  { k: K.SockC, w: 0.8, s: 1.0 },
  { k: K.Receipt, w: 2.2, s: 1.0 },
  { k: K.Keys, w: 1.4, s: 0.95 },
  { k: K.Charger, w: 1.4, s: 1.05 },
  { k: K.Bubble, w: 2.0, s: 0.92 },
  { k: K.Email, w: 2.0, s: 0.95 },
  { k: K.Monday, w: 1.0, s: 1.0 },
]

export const RETURNS = [
  { id: 'sock', k: K.SockA, key: 'void_back_sock' },
  { id: 'tie', k: K.Tie, key: 'void_back_tie' },
  { id: 'bud', k: K.Bud, key: 'void_back_bud' },
  { id: 'umbrella', k: K.Umbrella, key: 'void_back_umbrella' },
] as const
export type ReturnId = (typeof RETURNS)[number]['id']

/** Atlas UV rect of a cell: [u0, v0, u1, v1]. */
export function cellUV(k: number): [number, number, number, number] {
  const cx = k % GRID
  const cy = (k / GRID) | 0
  const inset = 2
  return [(cx * CELL + inset) / ATLAS, (cy * CELL + inset) / ATLAS, ((cx + 1) * CELL - inset) / ATLAS, ((cy + 1) * CELL - inset) / ATLAS]
}

const INK = '#0B0A14'

type C = CanvasRenderingContext2D

function rr(c: C, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath()
  c.roundRect(x, y, w, h, r)
}

/** Fill, then a soft top-left light gradient on top, then the ink outline. */
function shade(c: C, fill: string, x0: number, y0: number, x1: number, y1: number, lit = 0.22, dark = 0.18) {
  c.fillStyle = fill
  c.fill()
  const g = c.createLinearGradient(x0, y0, x1, y1)
  g.addColorStop(0, `rgba(255,255,255,${lit})`)
  g.addColorStop(0.5, 'rgba(255,255,255,0)')
  g.addColorStop(1, `rgba(0,0,0,${dark})`)
  c.fillStyle = g
  c.fill()
}
function ink(c: C, w = 3) {
  c.strokeStyle = INK
  c.lineWidth = w
  c.lineJoin = 'round'
  c.lineCap = 'round'
  c.stroke()
}

function sock(c: C, body: string, stripe: string, patch: string) {
  const path = () => {
    c.beginPath()
    c.moveTo(30, 8)
    c.lineTo(60, 8)
    c.lineTo(60, 50)
    c.quadraticCurveTo(60, 58, 68, 60)
    c.lineTo(84, 64)
    c.bezierCurveTo(98, 67, 98, 92, 82, 92)
    c.lineTo(46, 92)
    c.bezierCurveTo(28, 92, 26, 80, 28, 66)
    c.closePath()
  }
  path()
  shade(c, body, 20, 10, 90, 95, 0.25, 0.22)
  c.save()
  path()
  c.clip()
  // heel and toe patches
  c.fillStyle = patch
  c.beginPath()
  c.ellipse(32, 84, 15, 14, 0, 0, Math.PI * 2)
  c.fill()
  c.beginPath()
  c.ellipse(96, 78, 14, 22, 0, 0, Math.PI * 2)
  c.fill()
  // cuff ribbing
  c.fillStyle = 'rgba(0,0,0,0.12)'
  c.fillRect(26, 8, 40, 14)
  c.strokeStyle = 'rgba(0,0,0,0.16)'
  c.lineWidth = 1.4
  for (let x = 33; x < 60; x += 4.5) {
    c.beginPath()
    c.moveTo(x, 9)
    c.lineTo(x, 21)
    c.stroke()
  }
  // two stripes
  c.fillStyle = stripe
  c.fillRect(26, 25, 40, 5.5)
  c.fillRect(26, 34, 40, 5.5)
  // a soft highlight down the leg
  c.fillStyle = 'rgba(255,255,255,0.28)'
  c.beginPath()
  c.ellipse(38, 48, 3.5, 16, 0, 0, Math.PI * 2)
  c.fill()
  c.restore()
  path()
  ink(c, 3)
}

function receipt(c: C) {
  const x0 = 29
  const x1 = 71
  const path = () => {
    c.beginPath()
    c.moveTo(x0, 6)
    c.lineTo(x1, 6)
    c.lineTo(x1 + 1.5, 88)
    const n = 7
    for (let i = 0; i <= n; i++) {
      const x = x1 + 1.5 - ((x1 - x0 + 3) * i) / n
      c.lineTo(x, i % 2 ? 94 : 88)
    }
    c.lineTo(x0 - 1.5, 88)
    c.closePath()
  }
  path()
  shade(c, '#F6F2E8', x0, 0, x1 + 20, 100, 0.2, 0.2)
  c.save()
  path()
  c.clip()
  // curl: a darker fold band near the top
  const g = c.createLinearGradient(0, 6, 0, 22)
  g.addColorStop(0, 'rgba(120,100,70,0.22)')
  g.addColorStop(1, 'rgba(120,100,70,0)')
  c.fillStyle = g
  c.fillRect(x0 - 2, 6, 50, 16)
  // store name block
  c.fillStyle = '#4A4552'
  c.fillRect(38, 13, 24, 4.5)
  // item lines with prices
  c.fillStyle = '#8D8794'
  const rows = [16, 22, 12, 19, 14, 20]
  rows.forEach((w, i) => {
    const y = 26 + i * 7.5
    c.fillRect(34, y, w, 3)
    c.fillRect(57, y, 9, 3)
  })
  // dashed rule + bold total
  c.fillStyle = '#6B6573'
  for (let x = 34; x < 66; x += 4) c.fillRect(x, 72, 2.2, 1.4)
  c.fillStyle = '#2A2630'
  c.fillRect(34, 77, 14, 4.2)
  c.fillRect(53, 76.5, 13, 5)
  c.restore()
  path()
  ink(c, 2.8)
}

function key(c: C, x: number, y: number, a: number, metal: string, edge: string) {
  c.save()
  c.translate(x, y)
  c.rotate(a)
  // bow (head) at origin, blade along +x
  c.beginPath()
  c.arc(0, 0, 11.5, 0, Math.PI * 2)
  c.moveTo(-3.5, 0)
  c.arc(-6.5, 0, 3, 0, Math.PI * 2, true)
  shade(c, metal, -10, -10, 10, 12, 0.45, 0.25)
  ink(c, 2.6)
  c.beginPath()
  c.moveTo(10, -5.5)
  c.lineTo(46, -5.5)
  c.lineTo(50, 0)
  c.lineTo(46, 5.5)
  // teeth
  c.lineTo(42, 4.5)
  c.lineTo(40, 9)
  c.lineTo(36, 9)
  c.lineTo(34, 4.5)
  c.lineTo(30, 4.5)
  c.lineTo(28, 8)
  c.lineTo(24, 8)
  c.lineTo(22, 4.5)
  c.lineTo(10, 4.5)
  c.closePath()
  shade(c, metal, 10, -6, 40, 10, 0.4, 0.25)
  c.strokeStyle = edge
  c.lineWidth = 1.2
  c.beginPath()
  c.moveTo(14, -0.5)
  c.lineTo(44, -0.5)
  c.stroke()
  c.beginPath()
  c.moveTo(10, -5.5)
  c.lineTo(46, -5.5)
  c.lineTo(50, 0)
  c.lineTo(46, 5.5)
  c.lineTo(42, 4.5)
  c.lineTo(40, 9)
  c.lineTo(36, 9)
  c.lineTo(34, 4.5)
  c.lineTo(30, 4.5)
  c.lineTo(28, 8)
  c.lineTo(24, 8)
  c.lineTo(22, 4.5)
  c.lineTo(10, 4.5)
  c.closePath()
  ink(c, 2.6)
  c.restore()
}

function keys(c: C) {
  // a split ring at the top, two keys hanging from it and fanned apart, a small fob
  const rx = 34
  const ry = 26
  const hang = (a: number, metal: string, edge: string) => key(c, rx + Math.cos(a) * 21, ry + Math.sin(a) * 21, a, metal, edge)
  c.save()
  c.translate(rx + Math.cos(2.35) * 16, ry + Math.sin(2.35) * 16)
  c.rotate(0.75)
  rr(c, -7, -2, 14, 26, 6)
  shade(c, '#FF4D7E', -7, -2, 7, 24, 0.35, 0.2)
  ink(c, 2.6)
  c.fillStyle = 'rgba(255,255,255,0.9)'
  c.beginPath()
  c.arc(0, 17, 2.4, 0, Math.PI * 2)
  c.fill()
  c.restore()
  hang(1.6, '#C9CED8', 'rgba(255,255,255,0.8)')
  hang(0.72, '#E7B54A', 'rgba(255,240,200,0.7)')
  // split ring drawn last so it threads through both bows
  c.beginPath()
  c.arc(rx, ry, 13, 0, Math.PI * 2)
  c.strokeStyle = INK
  c.lineWidth = 6.5
  c.stroke()
  c.strokeStyle = '#D9DDE6'
  c.lineWidth = 3.4
  c.stroke()
  c.strokeStyle = 'rgba(255,255,255,0.9)'
  c.lineWidth = 1.2
  c.beginPath()
  c.arc(rx, ry, 13, Math.PI * 1.1, Math.PI * 1.5)
  c.stroke()
}

function charger(c: C) {
  // cable first, under the brick: brick bottom -> loop -> USB-C plug
  const cable = () => {
    c.beginPath()
    c.moveTo(40, 52)
    c.bezierCurveTo(40, 78, 14, 76, 18, 60)
    c.bezierCurveTo(22, 44, 58, 50, 62, 70)
    c.bezierCurveTo(65, 84, 76, 86, 80, 74)
  }
  cable()
  c.strokeStyle = INK
  c.lineWidth = 9
  c.lineCap = 'round'
  c.stroke()
  cable()
  c.strokeStyle = '#ECEEF3'
  c.lineWidth = 5.2
  c.stroke()
  // USB-C plug
  c.save()
  c.translate(81, 70)
  c.rotate(-1.1)
  rr(c, -6, -10, 12, 18, 3.5)
  shade(c, '#F4F5F8', -6, -10, 6, 8, 0.3, 0.2)
  ink(c, 2.6)
  rr(c, -3.6, -18, 7.2, 9, 2.5)
  shade(c, '#B9BEC9', -4, -18, 4, -9, 0.5, 0.3)
  ink(c, 2.2)
  c.restore()
  // brick with prongs
  c.fillStyle = INK
  rr(c, 29, 6, 5.5, 14, 1.5)
  c.fill()
  rr(c, 45.5, 6, 5.5, 14, 1.5)
  c.fill()
  c.fillStyle = '#CDD2DC'
  rr(c, 30.2, 7, 3.1, 12, 1)
  c.fill()
  rr(c, 46.7, 7, 3.1, 12, 1)
  c.fill()
  rr(c, 21, 16, 38, 38, 8)
  shade(c, '#F7F8FB', 21, 16, 59, 54, 0.25, 0.24)
  ink(c, 3)
  // faint face detail
  c.fillStyle = 'rgba(30,30,40,0.12)'
  rr(c, 27, 22, 26, 3, 1.5)
  c.fill()
  c.fillStyle = 'rgba(255,255,255,0.7)'
  rr(c, 25, 21, 4, 22, 2)
  c.fill()
}

function bubble(c: C) {
  const path = () => {
    c.beginPath()
    c.roundRect(10, 22, 70, 50, 18)
    // tail at lower left
    c.moveTo(22, 66)
    c.quadraticCurveTo(20, 80, 10, 86)
    c.quadraticCurveTo(28, 84, 38, 70)
  }
  path()
  shade(c, '#3DDC84', 10, 22, 80, 86, 0.28, 0.2)
  path()
  ink(c, 3)
  // typing dots
  c.fillStyle = '#F2FFF6'
  for (let i = 0; i < 3; i++) {
    c.beginPath()
    c.arc(30 + i * 15, 47, 5, 0, Math.PI * 2)
    c.fill()
  }
  // red unread badge
  c.beginPath()
  c.roundRect(56, 6, 38, 26, 13)
  shade(c, '#FF3B4E', 56, 6, 94, 32, 0.3, 0.2)
  ink(c, 3)
  c.fillStyle = '#fff'
  c.font = `800 17px ${FONT}`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText('99+', 75, 20)
}

function email(c: C) {
  rr(c, 8, 24, 76, 54, 6)
  shade(c, '#F3F5FA', 8, 24, 84, 78, 0.2, 0.22)
  ink(c, 3)
  // flap
  c.beginPath()
  c.moveTo(10, 27)
  c.lineTo(46, 56)
  c.lineTo(82, 27)
  c.strokeStyle = '#9AA3B8'
  c.lineWidth = 3
  c.lineJoin = 'round'
  c.stroke()
  c.beginPath()
  c.moveTo(10, 75)
  c.lineTo(36, 50)
  c.moveTo(82, 75)
  c.lineTo(56, 50)
  c.strokeStyle = 'rgba(154,163,184,0.6)'
  c.lineWidth = 2
  c.stroke()
  // who it is from (the 甲方 joke): a bold sender tag on the front
  const who = vt('void_client')
  c.font = `900 ${who.length > 3 ? 15 : 21}px ${FONT}`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillStyle = '#C81E3A'
  c.fillText(who, 46, 67, 64)
  // "urgent" flag: red circle with !
  c.beginPath()
  c.arc(80, 24, 15, 0, Math.PI * 2)
  shade(c, '#FF3B4E', 66, 10, 94, 38, 0.3, 0.2)
  ink(c, 3)
  c.fillStyle = '#fff'
  rr(c, 77.6, 14, 4.8, 13, 2.4)
  c.fill()
  c.beginPath()
  c.arc(80, 31.5, 2.8, 0, Math.PI * 2)
  c.fill()
}

function monday(c: C) {
  rr(c, 14, 14, 72, 74, 9)
  shade(c, '#FBFAF7', 14, 14, 86, 88, 0.2, 0.22)
  c.save()
  rr(c, 14, 14, 72, 74, 9)
  c.clip()
  c.fillStyle = '#E8384F'
  c.fillRect(14, 14, 72, 24)
  c.fillStyle = 'rgba(255,255,255,0.18)'
  c.fillRect(14, 14, 72, 6)
  // torn-off stubs line
  c.fillStyle = 'rgba(0,0,0,0.12)'
  c.fillRect(14, 38, 72, 2)
  c.restore()
  rr(c, 14, 14, 72, 74, 9)
  ink(c, 3)
  // binder rings
  for (const x of [32, 68]) {
    rr(c, x - 3.5, 7, 7, 15, 3.5)
    shade(c, '#C9CED8', x - 3, 7, x + 3, 22, 0.5, 0.3)
    ink(c, 2.4)
  }
  const word = vt('void_monday')
  c.fillStyle = '#23202B'
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  const fs = word.length > 2 ? 27 : 30
  c.font = `900 ${fs}px ${FONT}`
  c.fillText(word, 50, 64, 64)
}

function hairTie(c: C) {
  // a slightly twisted elastic: two overlapping ellipses, with a crimp
  c.save()
  c.translate(50, 50)
  c.rotate(-0.3)
  for (const [rx, ry, a] of [
    [34, 26, 0.12],
    [31, 28, -0.1],
  ] as const) {
    c.beginPath()
    c.ellipse(0, 0, rx, ry, a, 0, Math.PI * 2)
    c.strokeStyle = '#3A3846'
    c.lineWidth = 11
    c.stroke()
    c.strokeStyle = '#1B1B22'
    c.lineWidth = 7.5
    c.stroke()
    // sheen
    c.beginPath()
    c.ellipse(0, 0, rx, ry, a, Math.PI * 1.05, Math.PI * 1.55)
    c.strokeStyle = 'rgba(200,205,225,0.55)'
    c.lineWidth = 2
    c.stroke()
  }
  // metal crimp
  c.rotate(0.9)
  rr(c, 27, -6, 10, 12, 2.5)
  shade(c, '#C9CCD6', 27, -6, 37, 6, 0.55, 0.3)
  ink(c, 2.4)
  c.restore()
}

function earbud(c: C) {
  c.save()
  c.translate(52, 50)
  c.rotate(0.12)
  c.scale(1.12, 1.12)
  // stem
  rr(c, -7, -6, 14, 46, 7)
  shade(c, '#F5F7FA', -7, -6, 7, 40, 0.35, 0.22)
  ink(c, 3)
  c.fillStyle = '#B9BFCB'
  rr(c, -4, 34, 8, 4, 2)
  c.fill()
  // bud head
  c.beginPath()
  c.ellipse(-4, -20, 20, 17, -0.2, 0, Math.PI * 2)
  shade(c, '#F5F7FA', -24, -37, 16, -3, 0.35, 0.24)
  ink(c, 3)
  // speaker mesh dot and tip
  c.fillStyle = '#4A4F5C'
  c.beginPath()
  c.ellipse(-14, -22, 6.5, 5, -0.5, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = 'rgba(255,255,255,0.8)'
  c.beginPath()
  c.ellipse(2, -28, 6, 3.5, -0.4, 0, Math.PI * 2)
  c.fill()
  c.restore()
}

function umbrella(c: C) {
  c.save()
  c.translate(51, 52)
  c.rotate(0.62)
  c.scale(1.18, 1.18)
  // shaft tip
  c.fillStyle = INK
  rr(c, -2.5, -46, 5, 12, 2)
  c.fill()
  // folded canopy: a long spindle with pleats and a strap
  const canopy = () => {
    c.beginPath()
    c.moveTo(0, -38)
    c.bezierCurveTo(15, -20, 16, 8, 10, 20)
    c.lineTo(-10, 20)
    c.bezierCurveTo(-16, 8, -15, -20, 0, -38)
    c.closePath()
  }
  canopy()
  shade(c, '#22D3EE', -12, -38, 12, 20, 0.35, 0.3)
  c.save()
  canopy()
  c.clip()
  c.strokeStyle = 'rgba(6,80,100,0.45)'
  c.lineWidth = 1.6
  for (const x of [-4, 4]) {
    c.beginPath()
    c.moveTo(0, -36)
    c.quadraticCurveTo(x * 1.6, -6, x, 20)
    c.stroke()
  }
  c.fillStyle = '#0E7490'
  c.fillRect(-14, -2, 28, 6)
  c.restore()
  canopy()
  ink(c, 3)
  // handle: shaft + J hook
  c.beginPath()
  c.moveTo(0, 20)
  c.lineTo(0, 34)
  c.arc(-8, 34, 8, 0, Math.PI, false)
  c.strokeStyle = INK
  c.lineWidth = 9
  c.lineCap = 'round'
  c.stroke()
  c.strokeStyle = '#3B2A22'
  c.lineWidth = 5
  c.stroke()
  c.strokeStyle = 'rgba(255,220,190,0.35)'
  c.lineWidth = 1.4
  c.beginPath()
  c.arc(-8, 34, 8, 0.2, Math.PI * 0.5, false)
  c.stroke()
  c.restore()
}

function dot(c: C) {
  const g = c.createRadialGradient(50, 50, 0, 50, 50, 46)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.8)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  c.fillStyle = g
  c.fillRect(0, 0, 100, 100)
}

const DRAW: Record<number, (c: C) => void> = {
  [K.SockA]: (c) => sock(c, '#F2EEE6', '#FF2D75', '#C9C3B8'),
  [K.SockB]: (c) => sock(c, '#2F3445', '#FFC233', '#1E2230'),
  [K.SockC]: (c) => sock(c, '#2EC4B6', '#F7F7F2', '#1F8C82'),
  [K.Receipt]: receipt,
  [K.Keys]: keys,
  [K.Charger]: charger,
  [K.Bubble]: bubble,
  [K.Email]: email,
  [K.Monday]: monday,
  [K.Tie]: hairTie,
  [K.Bud]: earbud,
  [K.Umbrella]: umbrella,
  [K.Dot]: dot,
  [K.White]: (c) => {
    c.fillStyle = '#fff'
    c.fillRect(0, 0, 100, 100)
  },
}

/** Bakes the atlas (premultiplied by the GL upload). */
export function bakeAtlas(): HTMLCanvasElement {
  const cv = document.createElement('canvas')
  cv.width = cv.height = ATLAS
  const c = cv.getContext('2d')!
  for (let k = 0; k < K.Count; k++) {
    c.save()
    c.translate((k % GRID) * CELL, ((k / GRID) | 0) * CELL)
    c.beginPath()
    c.rect(0, 0, CELL, CELL)
    c.clip()
    // 100-unit design box with an 8% margin so mip levels do not bleed between cells
    const pad = k === K.White ? 0 : CELL * 0.06
    c.translate(pad, pad)
    c.scale((CELL - pad * 2) / 100, (CELL - pad * 2) / 100)
    DRAW[k](c)
    c.restore()
  }
  return cv
}
