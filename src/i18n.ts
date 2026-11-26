// Interface text every toy shares (shared file, copied into each repo unchanged): the toy names for the
// More menu, Share, More, About. Each toy's own text (hints, toasts, share lines) is in its strings.ts,
// which is not shared, so a toy only ships its own words. Share sheet and card copy load with the sheet.
// Five major languages, picked from the browser's language list; anything else falls back to English.
// Arcade shouts (CRITICAL!, CLEAR!, CHAIN, OVERDRIVE) stay English on purpose.
import TOY from './strings'

export const LOCALES = ['en', 'zh-CN', 'es', 'fr', 'ja'] as const

export type Locale = (typeof LOCALES)[number]
/** The live toys: listed in the More menu, their names are shared text. */
export type LiveId = 'charge' | 'void' | 'smash' | 'pop' | 'knock' | 'purr' | 'squish' | 'scratch' | 'peel' | 'twirl' | 'yoink'
/** Every toy id. A toy not yet live keeps its name in its own strings.ts until launch (then: LiveId, core name). */
export type ToyId = LiveId | 'crunch' | 'pour' | 'stamp' | 'zip'

const en = {
  name_charge: "Charge Burst",
  name_void: "Void Harvest",
  name_smash: "Glass Smash",
  name_pop: "Chain Pop",
  name_knock: "Knock on Wood",
  name_purr: "Lap Cat",
  name_squish: "Squishy Bun",
  name_scratch: "Scratch That",
  name_peel: "Peel Off",
  name_twirl: "Give It a Twirl",
  name_yoink: "Tablecloth Trick",
  share: "Share",
  more: "More",
  about: "How to play",
  more_games: "More games · games.integ.life →",
}
const zhCN: typeof en = {
  name_charge: "蓄力核爆",
  name_void: "黑洞收割",
  name_smash: "暴力碎屏",
  name_pop: "连锁泡泡",
  name_knock: "电子木鱼",
  name_purr: "云撸猫",
  name_squish: "捏捏团子",
  name_scratch: "刮一张",
  name_peel: "撕膜",
  name_twirl: "转圈圈",
  name_yoink: "抽桌布",
  share: "分享",
  more: "更多",
  about: "玩法说明",
  more_games: "更多游戏 · games.integ.life →",
}
const es: typeof en = {
  name_charge: "Carga Explosiva",
  name_void: "Agujero Negro",
  name_smash: "Rompe el Cristal",
  name_pop: "Burbujas en Cadena",
  name_knock: "Toca Madera",
  name_purr: "Gato Mimoso",
  name_squish: "Bollito Blandito",
  name_scratch: "Rasca y Verás",
  name_peel: "Quita el Plástico",
  name_twirl: "Falda con Vuelo",
  name_yoink: "El Truco del Mantel",
  share: "Compartir",
  more: "Más",
  about: "Cómo jugar",
  more_games: "Más juegos · games.integ.life →",
}
const fr: typeof en = {
  name_charge: "Charge Explosive",
  name_void: "Trou Noir",
  name_smash: "Casse la Vitre",
  name_pop: "Bulles en Chaîne",
  name_knock: "Touche du Bois",
  name_purr: "Chat Câlin",
  name_squish: "Petit Mochi Tout Mou",
  name_scratch: "Grattez Voir",
  name_peel: "Pelez-Moi Ça",
  name_twirl: "La Jupe qui Tourne",
  name_yoink: "Le Coup de la Nappe",
  share: "Partager",
  more: "Plus",
  about: "Comment jouer",
  more_games: "Plus de jeux · games.integ.life →",
}
const ja: typeof en = {
  name_charge: "チャージバースト",
  name_void: "ブラックホール",
  name_smash: "ガラス粉砕",
  name_pop: "連鎖バブル",
  name_knock: "電子木魚 ぽくぽく",
  name_purr: "なでなで猫",
  name_squish: "もちもちにぎにぎ",
  name_scratch: "けずってスクラッチ",
  name_peel: "ペリペリ保護フィルム",
  name_twirl: "くるくるスカート",
  name_yoink: "テーブルクロス引き",
  share: "シェア",
  more: "もっと",
  about: "遊び方",
  more_games: "その他のゲーム · games.integ.life →",
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
