// Google Analytics 4 for the toys (shared file, copied into each repo).
// Reuses the "Integ Games" GA4 property (games.integ.life, same integ.life account); the toys are
// told apart by page title ("Toy · …") and hostname.
// Follows the integ.life convention: production host only, consent queued first,
// no auto page_view, no ads signals, fixed titles and paths, no referrer.
import type { ToyId } from './i18n'

export const MEASUREMENT_ID = 'G-FZ76Z2ZFKD' // Integ Games property; empty string turns analytics off

const TITLES: Record<ToyId, string> = {
  charge: 'Toy · Charge Burst',
  void: 'Toy · Void Harvest',
  smash: 'Toy · Glass Smash',
  pop: 'Toy · Chain Pop',
  knock: 'Toy · Knock on Wood',
  purr: 'Toy · Lap Cat',
  squish: 'Toy · Squishy Bun',
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
  const page = { page_location: `https://${host}/`, page_referrer: '', page_title: TITLES[toy] }
  gtag('config', MEASUREMENT_ID, { send_page_view: false, ...page })
  gtag('event', 'page_view', { send_to: MEASUREMENT_ID, ...page })
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.append(s)
}

/** Gameplay events (first touch, big moments). Numbers only, never user text. */
export function track(event: string, params: Record<string, number | string> = {}) {
  gtag?.('event', event, { send_to: MEASUREMENT_ID, ...params })
}
