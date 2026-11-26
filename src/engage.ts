// Engagement counting for the toys (shared file, copied into each repo; loaded lazily by analytics.ts,
// production host only). The toy calls act(kind) once per gesture or unit; nothing is sent per tap.
// Sent, batched, numbers and fixed words only:
//   engage {kind, n, active_s}: per kind, deltas since the last flush; at most every 30 s of input, and on hide.
//     n can be 0 (active time with no new action of that kind).
//   engage_milestone {kind, n}: a kind first reaches 1/10/50/100/500/1000 this page session (sent with the next flush).
//   session_end {active_s, actions, kinds, visit_n}: on hide; active_s and actions are deltas since the last
//     session_end, kinds is the number of kinds used so far, visit_n the count of distinct days with a visit (max 99).
// Active time: time with input (pointer or key) in the last 5 s while visible, credited to the latest act() kind.
import { track } from './analytics'

const STEPS = [1, 10, 50, 100, 500, 1000]
const tot: Record<string, number> = {} // actions this page session
const sent: Record<string, number> = {} // tot at the last flush
const ms: Record<string, number> = {} // active ms per kind, not yet sent
let cur = ''
let last = -1e9 // last input
let upto = 0 // active time credited up to here
let flushed = 0
let acts = 0
let actsSent = 0
let msAll = 0 // active ms not yet in a session_end
let visit = 1

function act(kind: string) {
  cur = kind
  tot[kind] = (tot[kind] || 0) + 1
  acts++
}

function credit(t: number) {
  const e = Math.min(t, last + 5000)
  if (e > upto) {
    msAll += e - upto
    if (cur) ms[cur] = (ms[cur] || 0) + e - upto
    upto = e
  }
}

function input() {
  const t = performance.now()
  if (document.hidden) return
  credit(t)
  if (t > last + 5000) upto = t
  last = t
  if (t - flushed >= 30000) flush()
}

// On hide, gtag.js sends its queue itself with sendBeacon; a transport_type param would only arrive as an
// event parameter (GA4 ignores it), so none is passed.
function flush(end?: 1) {
  for (const k in tot) {
    const n = tot[k] - (sent[k] || 0)
    const s = Math.round((ms[k] || 0) / 1000)
    if (n || s) {
      track('engage', { kind: k, n, active_s: s })
      ms[k] = (ms[k] || 0) - s * 1000
      flushed = performance.now()
    }
    for (const m of STEPS) if ((sent[k] || 0) < m && m <= tot[k]) track('engage_milestone', { kind: k, n: m })
    sent[k] = tot[k]
  }
  const s = Math.round(msAll / 1000)
  if (end && (acts > actsSent || s)) {
    track('session_end', { active_s: s, actions: acts - actsSent, kinds: Object.keys(tot).length, visit_n: visit })
    actsSent = acts
    msAll -= s * 1000
  }
}

function hide() {
  credit(performance.now())
  last = -1e9
  flush(1)
}

/** Starts counting; `queued` holds the kinds acted before this chunk loaded. Returns act(). */
export function startEngage(queued: string[]) {
  try {
    const d = new Date()
    const day = d.getFullYear() * 1e4 + d.getMonth() * 100 + d.getDate() // a local-day key, not a date
    const [ld, n] = (localStorage.getItem('integ_visit') || '0,0').split(',').map(Number)
    visit = Math.min(99, ld === day ? n || 1 : n + 1)
    localStorage.setItem('integ_visit', day + ',' + visit)
  } catch {
    /* storage blocked: visit_n stays 1 */
  }
  for (const e of ['pointerdown', 'pointermove', 'keydown']) addEventListener(e, input, { capture: true, passive: true })
  document.addEventListener('visibilitychange', () => document.hidden && hide())
  addEventListener('pagehide', hide)
  queued.forEach(act)
  return act
}
