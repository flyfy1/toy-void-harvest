// Portals (shared file, a lazy chunk; spec /tmp/agent-tasks/portals/design.md): one object in a toy's scene that
// belongs to another toy. The object keeps doing what it always did; on the second tap (an event, for the three
// that cannot be tapped) a small bubble shows beside it for about 4 s, and only a tap on the bubble leaves, in the
// same tab, with ?from=<from>-<obj>-<hop>. The other toy reads `from` (share.ts strips it at load) and shows a tag.
// The links form a one-way graph that ends at smash; the hop in the link ends a chain after three toys.
// Caps hold without GA and on localhost. ?portal=1 (as first loaded) skips the warm-up and the device rests.
// GA: portal_show / portal_go {from, to, obj}, portal_arrive {from, to, obj, hop}: enums and one digit only.
import { track } from './analytics'
import { locale, tx, type Locale, type ToyId } from './i18n'
import { PANEL } from './names'
import { arrivedFrom, pointer, store, subscribe, type Anchor } from './share'
import { show, type Bubble, type Skin } from './components/Portal'

// ---------- the link table ----------

type Side = 'up' | 'down' | 'left' | 'right'
/** from, obj, to, taps before the bubble (1: an event link), skin, paper, ink, side of the object */
type Link = [ToyId, string, ToyId, number, Skin, string, string, Side]
const LINKS: Link[] = [
  ['silk', 'cat', 'purr', 2, 'say', '#FFF9F0', '#4A3A2C', 'up'],
  ['yoink', 'cat', 'purr', 2, 'say', '#FFF9F0', '#4A3A2C', 'up'],
  ['yoink', 'bowl', 'smash', 2, 'tag', '#F4F1EA', '#A3221B', 'up'],
  ['purr', 'glass', 'smash', 1, 'tag', '#FFF8EE', '#4A3A2C', 'down'],
  ['pop', 'fragile', 'smash', 2, 'tag', '#E2CDA6', '#7E150F', 'up'],
  ['twirl', 'coin', 'scratch', 2, 'tag', '#FBF4E4', '#4A3426', 'up'],
  ['void', 'sock', 'silk', 1, 'slip', 'rgba(7,6,15,.78)', '#A5F3FC', 'down'],
  ['peel', 'remote', 'yoink', 2, 'sms', 'rgba(255,255,255,.95)', '#2B2620', 'down'],
  ['knock', 'incense', 'silk', 2, 'tag', '#FFF8EA', '#3A2A1C', 'right'],
  ['charge', 'fish', 'knock', 2, 'say', '#DDF3EE', '#0F3436', 'up'],
  ['squish', 'paw', 'purr', 1, 'tag', '#FFF8F6', '#5A3440', 'up'],
  // scratch's prize toasts: the second line only, no bubble (prizeLine)
  ['scratch', 'prize_cat', 'purr', 1, 'tag', '', '', 'up'],
  ['scratch', 'prize_merit', 'knock', 1, 'tag', '', '', 'up'],
  ['scratch', 'prize_pop', 'pop', 1, 'tag', '', '', 'up'],
  ['scratch', 'prize_squish', 'squish', 1, 'tag', '', '', 'up'],
  ['scratch', 'prize_glass', 'smash', 1, 'tag', '', '', 'up'],
]
const find = (from: string, obj: string) => LINKS.find((l) => l[0] === from && l[1] === obj)

// ---------- copy ----------

/** [bubble, verb, arrival tag, smash's first pane] per link, written per language (portal-copy/<locale>.ts, loaded beside this chunk) */
export type Copy = Record<string, [string, string, string, string?]>
const LOAD: Record<Locale, () => Promise<{ default: Copy }>> = {
  en: () => import('./portal-copy/en'),
  'zh-CN': () => import('./portal-copy/zh-CN'),
  es: () => import('./portal-copy/es'),
  fr: () => import('./portal-copy/fr'),
  ja: () => import('./portal-copy/ja'),
}
let C: Copy = {}
/** the copy for this locale; share.ts waits for it (if it cannot load, no portal shows) */
export const ready = LOAD[locale]().then((m) => void (C = m.default))
/** "Open Lap Cat (purr.integ.life)": the bubble's accessible name says it leaves */
const OPEN: Record<Locale, (name: string, host: string) => string> = {
  en: (n, h) => `Open ${n} (${h})`,
  'zh-CN': (n, h) => `打开${n}（${h}）`,
  es: (n, h) => `Abrir ${n} (${h})`,
  fr: (n, h) => `Ouvrir ${n} (${h})`,
  ja: (n, h) => `${n}を開く（${h}）`,
}

// ---------- the caps (spec 3.5) ----------

const now = () => performance.now()
/** ?portal=1 as the page was first loaded (the toys rewrite their query later) */
const DEBUG = (() => {
  try {
    return /[?&]portal=1(&|$)/.test(new URL((performance.getEntriesByType('navigation')[0] as PerformanceEntry | undefined)?.name || location.href).search)
  } catch {
    return false
  }
})()
const DAY = 864e5
const mem: Record<string, string> = {}
let blocked = false
function get<T>(s: 'session' | 'local', k: string, d: T): T {
  try {
    const v = (s === 'local' ? localStorage : sessionStorage).getItem(k)
    return v ? (JSON.parse(v) as T) : d
  } catch {
    blocked = true
    return mem[s + k] ? (JSON.parse(mem[s + k]) as T) : d
  }
}
function set(s: 'session' | 'local', k: string, v: unknown) {
  const j = JSON.stringify(v)
  try {
    ;(s === 'local' ? localStorage : sessionStorage).setItem(k, j)
  } catch {
    blocked = true
    mem[s + k] = j
  }
}
/** this visit (kept for the page session, so a reload on the middle toy does not reset it): hop and the toy it came from */
interface Visit { h: number; f: string }
/** this page session: objects shown, bubbles shown, Date.now() of the last */
interface Sess { o: string[]; n: number; at: number }
/** this device, per object: [ignored in a row, resting until (Date.now())] */
type Dev = Record<string, [number, number]>

const visit = (): Visit => get('session', 'portal.v', { h: 0, f: '' })
const shownThisLoad = { n: 0 }

/** Can this link show now? `soft`: false for the gates that pass with time (a finger down, a peak, a message). */
function gates(l: Link, soft: boolean): boolean {
  const key = l[0] + '-' + l[1]
  const v = visit()
  if (v.h >= 2 || l[2] === v.f) return false
  if (!DEBUG && (!pointer.first || now() - pointer.first < (v.h ? 45e3 : 20e3))) return false
  const s = get<Sess>('session', 'portal.s', { o: [], n: 0, at: 0 })
  if (s.o.includes(key)) return false
  if (l[0] !== 'scratch' && (s.n >= 2 || Date.now() - s.at < 90e3)) return false
  if (blocked && shownThisLoad.n >= 1) return false
  const d = get<Dev>('local', 'portal', {})[key]
  if (!DEBUG && d && d[1] > Date.now()) return false
  if (!soft) return true
  // a quiet second first: no tap in the last 1 s (a fast tapper would dismiss it at once)
  return !pointer.down && now() - lastUp >= 300 && now() - lastDown >= 1000 && now() - store.peakAt >= 2500 && !store.slip && !store.sheet && !busy()
}

/** another message is on screen: About, a menu or toy panel (data-busy), a text box in use, an arrival tag */
const busy = () =>
  document.body.classList.contains('about-open') || !!document.querySelector('[data-busy]') || /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || '') || tagUp

function shown(l: Link) {
  const key = l[0] + '-' + l[1]
  const s = get<Sess>('session', 'portal.s', { o: [], n: 0, at: 0 })
  s.o.push(key)
  if (l[0] !== 'scratch') {
    s.n++
    s.at = Date.now()
  }
  set('session', 'portal.s', s)
  shownThisLoad.n++
  track('portal_show', { from: l[0], to: l[2], obj: l[1] })
}
/** gone: tapped (T links stay open, the player knows the door is there; E links rest 7 days) or ignored (twice: 30 days) */
function after(l: Link, went: boolean) {
  const key = l[0] + '-' + l[1]
  const all = get<Dev>('local', 'portal', {})
  const d = all[key] || [0, 0]
  if (went) all[key] = [0, l[3] === 1 && l[0] !== 'scratch' ? Date.now() + 7 * DAY : 0]
  else all[key] = d[0] + 1 >= 2 ? [0, Date.now() + 30 * DAY] : [d[0] + 1, d[1]]
  set('local', 'portal', all)
}
const href = (l: Link) => `https://${l[2]}.integ.life/?from=${l[0]}-${l[1]}-${visit().h + 1}`
const go = (l: Link) => {
  track('portal_go', { from: l[0], to: l[2], obj: l[1] })
  after(l, true)
}
const hostLine = (l: Link) => `${C[l[0] + '-' + l[1]][1]} · ${l[2]}.integ.life →`
const label = (l: Link) => OPEN[locale](PANEL[locale][`name_${l[2] as 'purr'}`] || l[2], `${l[2]}.integ.life`)

// ---------- input the gates read: the last finger up and where, the last mouse move ----------

let lastUp = -1e9
let lastDown = -1e9
let lastMove = -1e9
let touchAt: [number, number] | null = null
addEventListener('pointerup', (e) => ((lastUp = now()), (touchAt = [e.clientX, e.clientY])), true)
addEventListener('pointerdown', (e) => ((lastDown = now()), (touchAt = [e.clientX, e.clientY])), true)
addEventListener('pointermove', (e) => e.pointerType === 'mouse' && (lastMove = now()), { capture: true, passive: true })

// ---------- offer: count the taps, then wait for the moment ----------

const taps: Record<string, [number, number]> = {}
let open: Link | null = null
let waiting = false

/**
 * The object was tapped (or did its gag). On the link's n-th tap (taps at least 300 ms apart) and every one after
 * until it shows, the bubble waits `wait` ms (the object's own reaction or line), then up to 3 s (an event: 8 s)
 * for the finger to be up 300 ms and no peak or message; if a cap says no, the count is kept for the next tap.
 */
export function offer(toy: ToyId, obj: string, at: Anchor, wait = 0) {
  const l = find(toy, obj)
  if (!l || open || waiting) return
  const tp = (taps[obj] ||= [0, -1e9])
  const t = now()
  if (t - tp[1] >= 300) tp[0]++
  tp[1] = t
  if (tp[0] < l[3] || !gates(l, false)) return
  waiting = true
  const ev = l[3] === 1
  const until = t + wait + (ev ? 8000 : 3000)
  // void (the pointer is the hole): on a mouse, also still for 1.5 s
  const still = toy === 'void'
  const tick = () => {
    const p = at()
    if (!p || now() > until || !gates(l, false)) return void (waiting = false)
    if (now() < t + wait || !gates(l, true) || (still && now() - lastMove < 1500)) return void setTimeout(tick, 100)
    waiting = false
    bubble(l, at)
  }
  setTimeout(tick, Math.max(wait, 300))
}

function bubble(l: Link, at: Anchor) {
  const c = C[l[0] + '-' + l[1]]
  open = l
  shown(l)
  let went = false
  const b: Bubble = {
    skin: l[4],
    paper: l[5],
    ink: l[6],
    side: l[7],
    text: c[0],
    line: hostLine(l),
    // peel's own sender label (peel_mum), as its Mum bubble shows it
    who: l[4] === 'sms' ? tx('peel_mum') : '',
    label: label(l),
    href: href(l),
    at,
    touch: touchAt,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    go: () => {
      went = true
      go(l)
    },
    // a tap in its first 350 ms (still inert) was meant for the toy: not an ignore
    gone: (ignored = true) => {
      if (!went && ignored) after(l, false)
      open = null
      unsub()
    },
  }
  const close = show(b)
  // a slip or the sheet opens: the bubble gives way
  const unsub = subscribe(() => (store.slip || store.sheet) && close())
}

// ---------- scratch: the prize toast's second line ----------

/** The second line for a prize toast (`verb · host →`), or null when a cap says no. Call shown() when it is on screen. */
export function prizeLine(obj: string): { text: string; href: string; label: string; shown: () => void; go: () => void; gone: () => void } | null {
  const l = find('scratch', obj)
  if (!l || !gates(l, false)) return null
  let went = false
  return {
    text: hostLine(l),
    href: href(l),
    label: label(l),
    shown: () => shown(l),
    go: () => {
      went = true
      go(l)
    },
    gone: () => !went && after(l, false),
  }
}

// ---------- arrival ----------

let tagUp = false
/** where the visit came from; `word`: smash's first pane, a fixed word from this table (never the ?w= path) */
export interface Arrived { from: string; obj: string; word: string }
/** A portal visit: checked against the link table (source, object, and this toy), kept for the session, the tag shown. */
let arrived: Arrived | null | undefined
export function arrive(toy: ToyId, tag: [string, string]): Arrived | null {
  if (arrived !== undefined) return arrived
  arrived = null
  const m = /^([a-z]+)-([a-z_]+)-(\d)$/.exec(arrivedFrom)
  const l = m && find(m[1], m[2])
  const hop = m ? Number(m[3]) : 0
  if (!m || !l || l[2] !== toy || hop < 1 || hop > 2) return null
  set('session', 'portal.v', { h: hop, f: l[0] } satisfies Visit)
  track('portal_arrive', { from: l[0], to: toy, obj: l[1], hop })
  tagUp = true
  show({ arrival: C[l[0] + '-' + l[1]][2], tag, gone: () => (tagUp = false) })
  return (arrived = { from: l[0], obj: l[1], word: C[l[0] + '-' + l[1]][3] || '' })
}
