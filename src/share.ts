// Social sharing, the part every toy loads up front: the stats the games write into, the words / name
// that travel in the link, who sent this visit (the `r` code), and the little store behind the share
// pill, the slip and the sheet. The sheet, the card drawing and all the share copy load on demand
// (ShareSheet.tsx, card.ts, cards.ts), at the first peak or the first tap on Share.
import { track } from './analytics'
import type { ToyId } from './i18n'

/** Best moment of this visit, written by the game, read when sharing. Never sent to analytics as text. */
export const stats: { n?: number; k?: number; words?: string[]; name?: string; coat?: string; skin?: string; last?: string } = {}

// ---------- smash / knock / scratch: custom words travel in the URL (?w=BUG,加班,老板) ----------

const MAX_WORDS = 10
const MAX_LEN = 12

/** Split user input / URL value into a clean word list. */
export function parseWords(raw: string | null | undefined, maxLen = MAX_LEN): string[] {
  if (!raw) return []
  return raw
    .split(/[,，、;；\n]+/)
    .map((w) => w.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, MAX_WORDS)
}

export function wordsFromUrl(maxLen = MAX_LEN): string[] {
  try {
    return parseWords(new URLSearchParams(location.search).get('w'), maxLen)
  } catch {
    return []
  }
}

export const encodeWords = (words: string[]) => words.map(encodeURIComponent).join(',')

/** Replace the query and note it as written on this device (see `landing`). */
export function setSearch(search: string) {
  const url = new URL(location.href)
  url.search = search
  history.replaceState(null, '', url.toString())
  try {
    localStorage.setItem(MINE, canon(search))
  } catch {
    /* private mode */
  }
}

/** Keep ?w= in the address bar in sync, so copying the URL shares the words too. */
export function syncWordsToUrl(words: string[]) {
  setSearch(words.length ? `?w=${encodeWords(words)}` : '')
}

// ---------- purr: the cat's name and coat travel in the URL (?n=Mochi&c=orange) ----------

export const COATS = ['tabby', 'orange', 'tux', 'void'] as const
export type Coat = (typeof COATS)[number]

/** A cat name: control characters removed, at most 12 characters. */
export const parseName = (raw: string | null | undefined): string => (raw || '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, MAX_LEN)
export const parseCoat = (raw: string | null | undefined): Coat => (COATS as readonly string[]).includes(raw || '') ? (raw as Coat) : 'tabby'

export function catFromUrl(): { name: string; coat: Coat } {
  try {
    const q = new URLSearchParams(location.search)
    return { name: parseName(q.get('n')), coat: parseCoat(q.get('c')) }
  } catch {
    return { name: '', coat: 'tabby' }
  }
}

export const catQuery = (name: string, coat: string) => {
  const q: string[] = []
  if (name) q.push(`n=${encodeURIComponent(name)}`)
  if (coat && coat !== 'tabby') q.push(`c=${coat}`)
  return q.length ? `?${q.join('&')}` : ''
}

/** Keep ?n=&c= in the address bar in sync (other query params are dropped, as with ?w=). */
export function syncCatToUrl(name: string, coat: string) {
  setSearch(catQuery(name, coat))
}

// ---------- squish: the bun's name and skin travel in the URL (?n=Boss&s=baozi) ----------

export const SKINS = ['mochi', 'baozi', 'tangyuan', 'paw'] as const
export type Skin = (typeof SKINS)[number]
export const parseSkin = (raw: string | null | undefined): Skin => (SKINS as readonly string[]).includes(raw || '') ? (raw as Skin) : 'mochi'

export function bunFromUrl(): { name: string; skin: Skin } {
  try {
    const q = new URLSearchParams(location.search)
    return { name: parseName(q.get('n')), skin: parseSkin(q.get('s')) }
  } catch {
    return { name: '', skin: 'mochi' }
  }
}

export const bunQuery = (name: string, skin: string) => {
  const q: string[] = []
  if (name) q.push(`n=${encodeURIComponent(name)}`)
  if (skin && skin !== 'mochi') q.push(`s=${skin}`)
  return q.length ? `?${q.join('&')}` : ''
}

/** Keep ?n=&s= in the address bar in sync (other query params are dropped). */
export function syncBunToUrl(name: string, skin: string) {
  setSearch(bunQuery(name, skin))
}

// ---------- who sent this visit: `r` = how it was sent + hop (f1, q2 …), no person or device id ----------

export const MINE = 'share.mine' // the last words / name written on this device (per toy: each toy is its own origin)
/** The query as data, decoded and sorted, without `r`, so encodings and order do not matter. */
export const canon = (search: string) =>
  [...new URLSearchParams(search)]
    .filter(([k]) => k !== 'r')
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('&')

export type Method = 'f' | 'l' | 'c' | 'q' | 'd'
export interface Landing {
  /** opened from somebody else's share (not the author coming back to their own link) */
  recipient: boolean
  /** first character of `r`, or 'none' for links from before `r` existed */
  src: Method | 'none'
  /** hop of the link that was opened (0 when unknown) */
  hop: number
  kind: 'words' | 'name' | 'time' | 'plain'
}

/** Read `r` once, before any sync…ToUrl runs, then take it out of the address bar. */
export const landing: Landing = (() => {
  const out: Landing = { recipient: false, src: 'none', hop: 0, kind: 'plain' }
  try {
    const q = new URLSearchParams(location.search)
    const r = q.get('r')
    const m = r && /^([flcqd])([1-9])$/.exec(r)
    if (m) {
      out.src = m[1] as Method
      out.hop = Number(m[2])
    }
    if (q.has('r')) {
      q.delete('r')
      const url = new URL(location.href)
      url.search = q.toString() ? `?${q.toString()}` : ''
      history.replaceState(null, '', url.toString())
    }
    out.kind = q.has('w') || q.has('g') ? 'words' : q.has('n') || q.has('c') || q.has('s') ? 'name' : q.has('t') ? 'time' : 'plain'
    const sent = !!m || location.pathname.startsWith('/g/') || out.kind === 'words' || out.kind === 'name'
    let mine = ''
    try {
      mine = localStorage.getItem(MINE) || ''
    } catch {
      /* private mode */
    }
    const content = canon(location.search)
    out.recipient = sent && !(content && content === mine)
  } catch {
    /* no URL API: treat as a plain visit */
  }
  return out
})()

/** Hop for a share made now: one more than the link this visit arrived on. */
export const hopOut = () => (landing.recipient ? Math.min(9, Math.max(1, landing.hop) + 1) : 1)

/** `shared_landing`, once, for recipient visits only. Extra numbers (word count, skin id) ride along. */
export function trackLanding(extra: Record<string, number | string> = {}) {
  if (landing.recipient) track('shared_landing', { src: landing.src, hop: landing.hop, kind: landing.kind, ...extra })
}

export type From = 'button' | 'slip' | 'reply' | 'receipt'
export type ShareMethod = 'file' | 'link' | 'copy_link' | 'copy_image' | 'save' | 'longpress' | 'weibo' | 'x' | 'whatsapp'

/** `share_method` on the tap; `share_done` (and `reply_share` for a recipient) once it went through. */
export function trackShare(stage: 'method' | 'done', method: ShareMethod, from: From, extra: Record<string, number> = {}) {
  if (stage === 'method') return track('share_method', { method, from })
  track('share_done', { method, from, ...extra })
  if (landing.recipient) track('reply_share', { method, hop: hopOut() })
}

// ---------- peaks, the card, the slip, the sheet ----------

/** What a game hands over at its peak: a snapshot taken in that frame and the numbers for the card. */
export interface Peak {
  snap: HTMLCanvasElement | null
  data: Record<string, number>
  /** a toy that draws its own document (purr's receipt) hands over the finished picture */
  card?: HTMLCanvasElement
}

export interface Card {
  /** PNG for the OS share sheet / download, object URL for <img>, the canvas for a JPEG in WeChat */
  blob: Blob
  url: string
  canvas: HTMLCanvasElement
  /** 1 for a peak card, 0 for the toy's default document */
  peak: 0 | 1
  /** the peak it was drawn from (a newer peak means the sheet draws it again) */
  of: Peak | null
}

export const store = {
  toy: null as ToyId | null,
  peak: null as Peak | null,
  /** the peak was reached in this visit: share text switches to the done form */
  done: false,
  card: null as Card | null,
  /** slip on screen (a counter, so React re-renders on each new one) */
  slip: 0,
  /** dot on the Share pill: a card is waiting */
  dot: false,
  /** slips swiped away this visit (two, and no more slips) */
  swiped: 0,
  /** sheet open, and where from */
  sheet: null as From | null,
  version: 0,
}
const subs = new Set<() => void>()
export function subscribe(fn: () => void) {
  subs.add(fn)
  return () => void subs.delete(fn)
}
export function emit() {
  store.version++
  subs.forEach((f) => f())
}

/**
 * Optional, set by a toy: its own snapshot (a crop around the subject), live numbers for the card, and
 * `reply`: what a recipient's answer button does (open the toy's text box, empty, for their own words);
 * `ticket`: scratch's unscratched gift ticket for the sender's card.
 */
export const live: { snap: (() => HTMLCanvasElement | null) | null; data: (() => Record<string, number>) | null; reply?: () => void; ticket?: () => HTMLCanvasElement | null } = { snap: null, data: null }

/** Is a finger (or button) down right now? The slip never appears under a finger. */
export const pointer = { down: false }
addEventListener('pointerdown', () => (pointer.down = true), true)
addEventListener('pointerup', () => (pointer.down = false), true)
addEventListener('pointercancel', () => (pointer.down = false), true)

/**
 * The game's peak. Called with a snapshot taken in the peak frame and numbers only. The slip shows no
 * sooner than 1.2 s after the peak, and only once the card is drawn (card.ts). `quiet` refreshes the
 * card without a slip (knock's later milestones).
 */
export function sharePeak(toy: ToyId, peak: Peak, quiet = false) {
  const t0 = performance.now()
  store.toy = toy
  store.peak = peak
  store.done = true
  import('./card').then(
    (m) => m.peakCard(toy, quiet, t0),
    () => {
      /* offline: no slip, the pill still works */
    },
  )
}

export function openSheet(from: From) {
  store.sheet = from
  store.slip = 0
  store.dot = false
  emit()
}
