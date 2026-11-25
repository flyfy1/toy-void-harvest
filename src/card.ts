// The share card (loaded on demand): one generator draws every toy's document from data (cards.ts).
// 1080 x 1350: the toy's own surface, a sheet of paper turned about a degree, the snapshot of the peak,
// title, rows, verdict, small print, and a real QR code with the address. System fonts only.
import qrcode from 'qrcode-generator'
import { locale, type ToyId } from './i18n'
import { emit, live, pointer, store, type Card, type Peak } from './share'
import { buildDoc, shareUrl, type Doc } from './cards'

export { shareExtra, shareText } from './cards'

export const W = 1080
export const H = 1350
const SANS =
  locale === 'ja'
    ? 'system-ui, -apple-system, "Hiragino Sans", "Noto Sans CJK JP", "Segoe UI", sans-serif'
    : 'system-ui, -apple-system, "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Microsoft YaHei", "Segoe UI", sans-serif'
const SERIF = locale === 'ja' ? '"Hiragino Mincho ProN", "Noto Serif CJK JP", serif' : '"Songti SC", "STSong", "Noto Serif CJK SC", Georgia, serif'
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, "PingFang SC", "Noto Sans SC", monospace'

/** A copy of the page's canvas for the default card; null when it reads back blank (WebGL). */
function pageSnap(): HTMLCanvasElement | null {
  try {
    const own = live.snap?.()
    if (own) return own
    const src = document.querySelector('canvas')
    if (!src || !src.width || !src.height) return null
    const k = Math.min(1, 1000 / src.width)
    const c = document.createElement('canvas')
    c.width = Math.round(src.width * k)
    c.height = Math.round(src.height * k)
    const g = c.getContext('2d', { willReadFrequently: true })!
    g.drawImage(src, 0, 0, c.width, c.height)
    const px = g.getImageData(0, 0, c.width, c.height).data
    let lo = 255
    let hi = 0
    for (let i = 0; i < px.length; i += 4 * 97) {
      const v = px[i] + px[i + 1] + px[i + 2] + (px[i + 3] < 8 ? -999 : 0)
      lo = Math.min(lo, v)
      hi = Math.max(hi, v)
    }
    return hi - lo < 12 ? null : c
  } catch {
    return null
  }
}

/** Shrink the font until the text fits the width. */
function fit(c: CanvasRenderingContext2D, text: string, weight: string, size: number, family: string, max: number, min = 20) {
  let fs = size
  c.font = `${weight} ${fs}px ${family}`
  while (fs > min && c.measureText(text).width > max) c.font = `${weight} ${--fs}px ${family}`
  return fs
}

/** Break a line into at most `lines` lines that fit the width (CJK by character, others by word). */
function wrap(c: CanvasRenderingContext2D, text: string, max: number, lines: number): string[] {
  const cjk = /[　-鿿＀-￯]/.test(text)
  const units = cjk ? [...text] : text.split(/(?<=\s)/)
  const out: string[] = []
  let cur = ''
  for (const u of units) {
    // closing punctuation never starts a line (it stays with the word before, a little over the edge)
    if (c.measureText(cur + u).width > max && cur && !/^[」』）)，。、！？：；”’»…]/.test(u)) {
      out.push(cur.trimEnd())
      cur = u.trimStart()
    } else cur += u
  }
  if (cur) out.push(cur)
  if (out.length > lines) {
    const keep = out.slice(0, lines)
    keep[lines - 1] = keep[lines - 1].replace(/.$/, '…')
    return keep
  }
  return out
}

function drawSurface(c: CanvasRenderingContext2D, d: Doc) {
  const g = c.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, d.look.surface[0])
  g.addColorStop(1, d.look.surface[1])
  c.fillStyle = g
  c.fillRect(0, 0, W, H)
  // a quiet grain so the surface reads as a material, not a flat fill
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  c.strokeStyle = d.look.grain
  for (let i = 0; i < 70; i++) {
    const y = rnd() * H
    c.lineWidth = 1 + rnd() * 2.5
    c.beginPath()
    c.moveTo(0, y)
    c.bezierCurveTo(W * 0.3, y + (rnd() - 0.5) * 30, W * 0.7, y + (rnd() - 0.5) * 30, W, y + (rnd() - 0.5) * 20)
    c.stroke()
  }
}

function drawQr(c: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, ink: string) {
  const qr = qrcode(0, 'M')
  qr.addData(text, 'Byte')
  qr.make()
  const n = qr.getModuleCount()
  const cell = Math.floor(size / (n + 2))
  const off = (size - cell * n) / 2
  c.fillStyle = '#FFFFFF'
  c.fillRect(x, y, size, size)
  c.fillStyle = ink
  for (let r = 0; r < n; r++) for (let q = 0; q < n; q++) if (qr.isDark(r, q)) c.fillRect(x + off + q * cell, y + off + r * cell, cell, cell)
}

const stamp = () => {
  const d = new Date()
  const p = (v: number) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Draw the document. Exported for the og-image script (1200 x 630 layout comes in WP2). */
export function drawCard(d: Doc, snap: HTMLCanvasElement | null, qrText: string): HTMLCanvasElement {
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const c = cv.getContext('2d')!
  drawSurface(c, d)

  const pw = 900
  const ph = 1236
  const pad = 54
  const inner = pw - pad * 2
  c.save()
  c.translate(W / 2, H / 2)
  c.rotate(-0.017)
  c.translate(-pw / 2, -ph / 2)
  c.shadowColor = 'rgba(0,0,0,0.45)'
  c.shadowBlur = 40
  c.shadowOffsetY = 14
  c.fillStyle = d.look.paper
  c.fillRect(0, 0, pw, ph)
  c.shadowColor = 'transparent'
  // border: an outer rule in the accent, a thin inner rule in the second accent
  c.strokeStyle = d.look.accent
  c.lineWidth = 6
  c.strokeRect(18, 18, pw - 36, ph - 36)
  c.strokeStyle = d.look.accent2
  c.lineWidth = 2
  c.strokeRect(30, 30, pw - 60, ph - 60)

  // lay out from the fixed footer up; the snapshot takes what is left (at most about 45% of the card)
  const ROW = 58
  const QS = 200
  const TOP = 58
  const rowsH = d.rows.length ? 74 + d.rows.length * ROW : 0
  c.font = `italic 700 50px ${SERIF}`
  const verdict = wrap(c, d.verdict, inner - 20, 2)
  const blockH = 84 + 40 + rowsH + 20 + verdict.length * 64
  const textH = blockH + 40 + QS + TOP
  let y = TOP
  // a document without rows (the default card) lets the picture take the room
  const snapH = snap ? Math.max(260, Math.min(d.rows.length ? 600 : 820, ph - TOP - textH)) : 0
  if (snap) {
    c.save()
    const clip = new Path2D()
    clip.roundRect(pad, y, inner, snapH, 16)
    c.clip(clip)
    c.fillStyle = d.look.surface[0]
    c.fillRect(pad, y, inner, snapH)
    // cover-fit around the document's focus point (knock: the floating text and the fish's face)
    const k = Math.max(inner / snap.width, snapH / snap.height)
    const sw = snap.width * k
    const sh = snap.height * k
    const fy = d.focus ?? 0.5
    c.drawImage(snap, pad + (inner - sw) / 2, y + Math.min(0, Math.max(snapH - sh, snapH / 2 - sh * fy)), sw, sh)
    c.restore()
    c.strokeStyle = d.look.accent2
    c.lineWidth = 2
    c.beginPath()
    c.roundRect(pad, y, inner, snapH, 16)
    c.stroke()
    y += snapH + 84
  } else y += Math.max(60, (ph - TOP - textH) / 2) + 84 // no picture (a WebGL toy reads back blank): centre the text

  // title, with a small seal to its right
  c.fillStyle = d.look.accent
  c.textAlign = 'center'
  c.textBaseline = 'alphabetic'
  fit(c, d.title, '800', 66, SANS, inner - 160, 36)
  c.fillText(d.title, pw / 2, y)
  if (d.seal) {
    c.save()
    c.translate(pw - pad - 50, y - 26)
    c.rotate(0.18)
    c.strokeStyle = d.look.accent
    c.globalAlpha = 0.85
    c.lineWidth = 4
    c.beginPath()
    c.arc(0, 0, 44, 0, Math.PI * 2)
    c.stroke()
    c.fillStyle = d.look.accent
    fit(c, d.seal, '800', 28, SANS, 70, 14)
    c.textBaseline = 'middle'
    c.fillText(d.seal, 0, 1)
    c.restore()
    c.textBaseline = 'alphabetic'
  }
  y += 40
  c.fillStyle = d.look.faint
  c.font = `400 24px ${MONO}`
  c.fillText(stamp(), pw / 2, y)

  // rows: label, dotted leader, value
  if (d.rows.length) {
    y += 24
    c.strokeStyle = d.look.faint
    c.setLineDash([8, 8])
    c.lineWidth = 2
    c.beginPath()
    c.moveTo(pad, y)
    c.lineTo(pw - pad, y)
    c.stroke()
    c.setLineDash([])
    y += 14
    for (const [label, value] of d.rows) {
      y += ROW
      c.textAlign = 'left'
      c.fillStyle = d.look.ink
      fit(c, label, '600', 38, SANS, inner * 0.55, 24)
      const lw = c.measureText(label).width
      c.fillText(label, pad, y)
      c.textAlign = 'right'
      fit(c, value, '700', 38, MONO, inner - lw - 60, 22)
      const vw = c.measureText(value).width
      c.fillText(value, pw - pad, y)
      // leader dots
      c.fillStyle = d.look.faint
      for (let x = pad + lw + 16; x < pw - pad - vw - 14; x += 14) c.fillRect(x, y - 6, 3, 3)
    }
    y += 36
    c.strokeStyle = d.look.faint
    c.setLineDash([8, 8])
    c.beginPath()
    c.moveTo(pad, y)
    c.lineTo(pw - pad, y)
    c.stroke()
    c.setLineDash([])
  }

  // verdict, the line people read aloud
  c.textAlign = 'center'
  c.fillStyle = d.look.accent
  c.font = `italic 700 50px ${SERIF}`
  y += 20
  for (const line of verdict) {
    y += 64
    c.fillText(line, pw / 2, y)
  }

  // footer: QR at the left; beside it the call line, the address and the small print (the second joke)
  const qy = ph - TOP - QS
  drawQr(c, qrText, pad, qy, QS, '#111111')
  const tx = pad + QS + 32
  const tw = inner - QS - 32
  c.textAlign = 'left'
  c.fillStyle = d.look.ink
  fit(c, d.call, '700', 36, SANS, tw, 22)
  c.fillText(d.call, tx, qy + 50)
  c.fillStyle = d.look.faint
  fit(c, d.host, '500', 30, MONO, tw, 20)
  c.fillText(d.host, tx, qy + 96)
  if (d.small) {
    c.font = `400 25px ${SANS}`
    wrap(c, d.small, tw, 2).forEach((line, i) => c.fillText(line, tx, qy + 156 + i * 34))
  }
  c.restore()
  return cv
}

export async function makeCard(toy: ToyId, peak: Peak | null): Promise<Card> {
  const d = buildDoc(toy, peak)
  const cv = drawCard(d, peak?.snap ?? pageSnap(), shareUrl(toy, 'q'))
  const blob = await new Promise<Blob>((ok, no) => cv.toBlob((b) => (b ? ok(b) : no(new Error('toBlob'))), 'image/png'))
  return { blob, url: URL.createObjectURL(blob), canvas: cv, peak: peak ? 1 : 0 }
}

/** Render (or re-render) the card; resolves when the image exists. */
export async function renderCard(toy: ToyId) {
  const card = await makeCard(toy, store.peak)
  if (store.card) URL.revokeObjectURL(store.card.url)
  store.card = card
  emit()
  return card
}

// ---------- the slip's rules: at most one per 90 s and three per visit; none after two swipes ----------

const SLIP_GAP = 90_000
const SLIP_MAX = 3
const slipLog = { shown: 0, last: -Infinity }

function offerSlip() {
  if (store.sheet) return
  const now = performance.now()
  if (slipLog.shown >= SLIP_MAX || store.swiped >= 2 || now - slipLog.last < SLIP_GAP) {
    store.dot = true
    return emit()
  }
  if (pointer.down) {
    window.setTimeout(offerSlip, 400)
    return
  }
  slipLog.shown++
  slipLog.last = now
  store.slip++
  emit()
}

/** After a peak: draw the card, then offer the slip no sooner than 1.2 s after the peak. */
export function peakCard(toy: ToyId, quiet: boolean, t0: number) {
  renderCard(toy).then(
    () => {
      if (quiet) return
      window.setTimeout(offerSlip, Math.max(0, 1200 - (performance.now() - t0)))
    },
    () => {
      /* the card failed to draw: no slip, the pill still works */
    },
  )
}
