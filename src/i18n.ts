// Interface text every toy shares (shared file, copied into each repo unchanged): Share, More. The open
// More menu's text (every live toy's name, How to play) is in names.ts and loads with the menu. Each toy's
// own text (its name, hints, toasts, share lines) is in its strings.ts, which is not shared, so a toy only ships its own words. Share sheet and card copy load with the sheet.
// Five major languages, picked from the browser's language list; anything else falls back to English.
// Arcade shouts (CRITICAL!, CLEAR!, CHAIN, OVERDRIVE) stay English on purpose.
import TOY from './strings'

export const LOCALES = ['en', 'zh-CN', 'es', 'fr', 'ja'] as const

export type Locale = (typeof LOCALES)[number]
/** The live toys: listed in the More menu (their names for it are in names.ts). */
export type LiveId = 'charge' | 'void' | 'smash' | 'pop' | 'knock' | 'purr' | 'squish' | 'scratch' | 'peel' | 'twirl' | 'yoink' | 'silk'
/** Every toy id. Each toy keeps its own name (name_<id>, five languages) in its strings.ts; at launch it joins
 *  LiveId and names.ts, the More menu, and Icons TOY_ICONS. */
export type ToyId = LiveId | 'crunch' | 'pour' | 'stamp' | 'zip'

const en = {
  share: "Share",
  more: "More",
}
const zhCN: typeof en = {
  share: "分享",
  more: "更多",
}
const es: typeof en = {
  share: "Compartir",
  more: "Más",
}
const fr: typeof en = {
  share: "Partager",
  more: "Plus",
}
const ja: typeof en = {
  share: "シェア",
  more: "もっと",
}

type Core = typeof en
export type Messages = Core & (typeof TOY)['en']
const CORE: Record<Locale, Core> = { en, 'zh-CN': zhCN, es, fr, ja }

function match(raw: string | null | undefined): Locale | null {
  if (!raw) return null
  const v = raw.toLowerCase()
  if (v.startsWith('zh')) return 'zh-CN'
  return LOCALES.find((l) => l.toLowerCase() === v || v.startsWith(l.toLowerCase() + '-')) ?? null
}

function detect(): Locale {
  for (const l of navigator.languages?.length ? navigator.languages : [navigator.language]) {
    const m = match(l)
    if (m) return m
  }
  return 'en'
}

export const locale: Locale = detect()
const M = { ...CORE[locale], ...TOY[locale] } as Messages

type StringKey = { [K in keyof Messages]: Messages[K] extends string ? K : never }[keyof Messages]
type ListKey = { [K in keyof Messages]: Messages[K] extends readonly string[] ? K : never }[keyof Messages]
export type Key = StringKey

const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))

export function t(key: StringKey, vars: Record<string, string | number> = {}): string {
  return fill(M[key] as string, vars)
}

/** Text by a computed key (shared code asking for `share_${toy}` and the like); '' if this toy has none. */
export function tx(key: string, vars: Record<string, string | number> = {}): string {
  const v = (M as Record<string, unknown>)[key]
  return typeof v === 'string' ? fill(v, vars) : ''
}

/** Text a toy loads after boot (scratch's prize pool, one file per language): merged into the table `t` and `tx` read. */
export function addStrings(more: Record<string, string>) {
  Object.assign(M, more)
}

/** A list of lines (smash's default words, knock's variants, charge's pfft lines …). */
export const list = (key: ListKey): readonly string[] => M[key] as readonly string[]

/** Localised <html lang>, <title> and description for the current toy. */
export function applyMeta(toy: ToyId) {
  document.documentElement.lang = locale
  const name = tx(`name_${toy}`)
  document.title = locale === 'en' ? `${name} · integ.life` : `${name} · ${({ ...en, ...TOY.en } as Record<string, unknown>)[`name_${toy}`]}`
  document.querySelector('meta[name="description"]')?.setAttribute('content', tx(`desc_${toy}`))
  const local = document.getElementById('about-local')
  if (local && locale !== 'en') {
    local.replaceChildren()
    const h = document.createElement('h2')
    h.textContent = name
    const p = document.createElement('p')
    p.textContent = tx(`desc_${toy}`)
    const tip = document.createElement('p')
    tip.textContent = tx(`hint_${toy}`)
    local.append(h, p, tip)
  }
}

/** The static About / FAQ article in index.html (crawlable text, shown on demand). */
export function openAbout(open = true) {
  document.body.classList.toggle('about-open', open)
}
