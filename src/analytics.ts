// Google Analytics 4 for the toys (shared file, copied into each repo).
// Reuses the "Integ Games" GA4 property (games.integ.life, same integ.life account); the toys are
// told apart by page title ("Toy · …") and hostname.
// Follows the integ.life convention: production host only, consent queued first,
// no auto page_view, no ads signals, fixed titles and paths, no referrer.
import type { ToyId } from './i18n'

export const MEASUREMENT_ID = 'G-FZ76Z2ZFKD' // Integ Games property; empty string turns analytics off

/** GA page titles, after "Toy · " */
const TITLES: Record<ToyId, string> = {
  charge: 'Charge Burst',
  void: 'Void Harvest',
  smash: 'Glass Smash',
  pop: 'Chain Pop',
  knock: 'Knock on Wood',
  purr: 'Lap Cat',
  scratch: 'Scratch That',
  squish: 'Squishy Bun',
  peel: 'Peel Off',
  crunch: 'Crispy Squish',
  pour: 'Perfect Pour',
  stamp: 'Rubber Stamp',
  zip: 'Zip It',
  twirl: 'Give It a Twirl',
  yoink: 'Tablecloth Trick',
}

type W = Window & { dataLayer?: unknown[] }
let gtag: ((...args: unknown[]) => void) | null = null

export function startAnalytics(toy: ToyId) {
  const w = window as W
  const host = `${toy}.integ.life`
  if (!MEASUREMENT_ID || gtag || w.location.hostname !== host || w.top !== w.self) return
  w.dataLayer = w.dataLayer || []
  gtag = function () {
    // gtag expects the Arguments object, not an array
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments)
  }
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' })
  gtag('js', new Date())
  gtag('set', { allow_google_signals: false, allow_ad_personalization_signals: false })
  const page = { page_location: `https://${host}/`, page_referrer: '', page_title: `Toy · ${TITLES[toy]}` }
  gtag('config', MEASUREMENT_ID, { send_page_view: false, ...page })
  gtag('event', 'page_view', { send_to: MEASUREMENT_ID, ...page })
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.append(s)
  // engagement counting (engage.ts), a small lazy chunk; act() queues until it is ready
  import('./engage').then(
    (m) => (eng = m.startEngage(queued)),
    () => (queued.length = 0),
  )
}

/** Gameplay and share events (first touch, big moments, the share funnel). Numbers and fixed words only, never user text. */
export function track(event: string, params: Record<string, number | string> = {}) {
  gtag?.('event', event, { send_to: MEASUREMENT_ID, ...params })
}

/** Engagement action kinds (fixed words). One act() per gesture or unit, never per frame. */
export type ActKind =
  | 'knock' | 'auto_knock' // knock
  | 'stroke' | 'chin' | 'belly' | 'trap' | 'swat' | 'knead' // purr (stroke: also scratch)
  | 'charge' | 'blew' | 'poke' | 'tap' // charge
  | 'pop' | 'wring' // pop
  | 'drag' | 'eat' | 'clear' // void
  | 'hit' | 'pane' | 'holdout' // smash
  | 'squeeze' | 'stretch' // squish
  | 'card' // scratch
  | 'peel_start' | 'peel_done' | 'relaid' | 'cling_shake' | 'cling_tap' // peel
  | 'spin' | 'fabric' // twirl
  | 'pull' | 'clean' | 'break' | 'table' // yoink

let eng: ((kind: string) => void) | null = null
const queued: string[] = []

/** One meaningful action (a gesture or a unit, never a frame); counted locally, sent in batches by engage.ts. */
export function act(kind: ActKind) {
  if (eng) eng(kind)
  else if (gtag && queued.length < 500) queued.push(kind)
}
