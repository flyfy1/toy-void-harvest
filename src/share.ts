// Social sharing: a small stats store the games write into, and the share payload/links.
import { t, type ToyId } from './i18n'

/** Best moment of this visit, written by the game, read when sharing. */
export const stats: { n?: number; words?: string[]; name?: string; coat?: string; skin?: string } = {}

// ---------- smash / knock: custom words travel in the URL (?w=BUG,加班,老板) ----------

const MAX_WORDS = 10
const MAX_LEN = 12

/** Split user input / URL value into a clean word list. */
export function parseWords(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw
    .split(/[,，、;；\n]+/)
    .map((w) => w.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_LEN))
    .filter(Boolean)
    .slice(0, MAX_WORDS)
}

export function wordsFromUrl(): string[] {
  try {
    return parseWords(new URLSearchParams(location.search).get('w'))
  } catch {
    return []
  }
}

const encodeWords = (words: string[]) => words.map(encodeURIComponent).join(',')

/** Keep ?w= in the address bar in sync, so copying the URL shares the words too. */
export function syncWordsToUrl(words: string[]) {
  const url = new URL(location.href)
  url.search = words.length ? `?w=${encodeWords(words)}` : ''
  history.replaceState(null, '', url.toString())
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

const catQuery = (name: string, coat: string) => {
  const q: string[] = []
  if (name) q.push(`n=${encodeURIComponent(name)}`)
  if (coat && coat !== 'tabby') q.push(`c=${coat}`)
  return q.length ? `?${q.join('&')}` : ''
}

/** Keep ?n=&c= in the address bar in sync (other query params are dropped, as with ?w=). */
export function syncCatToUrl(name: string, coat: string) {
  const url = new URL(location.href)
  url.search = catQuery(name, coat)
  history.replaceState(null, '', url.toString())
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

const bunQuery = (name: string, skin: string) => {
  const q: string[] = []
  if (name) q.push(`n=${encodeURIComponent(name)}`)
  if (skin && skin !== 'mochi') q.push(`s=${skin}`)
  return q.length ? `?${q.join('&')}` : ''
}

/** Keep ?n=&s= in the address bar in sync (other query params are dropped). */
export function syncBunToUrl(name: string, skin: string) {
  const url = new URL(location.href)
  url.search = bunQuery(name, skin)
  history.replaceState(null, '', url.toString())
}

// ---------- payload ----------

export function shareUrl(toy: ToyId): string {
  const base = `https://${toy}.integ.life/`
  if ((toy === 'smash' || toy === 'knock') && stats.words?.length) return `${base}?w=${encodeWords(stats.words)}`
  if (toy === 'purr') return base + catQuery(stats.name || '', stats.coat || '')
  if (toy === 'squish') return base + bunQuery(stats.name || '', stats.skin || '')
  return base
}

export function shareText(toy: ToyId): string {
  if (toy === 'smash' && stats.words?.length) return t('share_smash_words', { w: stats.words.join(', ') })
  if (toy === 'knock' && stats.words?.length) return t('share_knock_words', { w: stats.words.join(', ') })
  if (toy === 'purr' && stats.name) return t('share_purr_name', { name: stats.name })
  if (toy === 'squish' && stats.name) return t('share_squish_name', { name: stats.name, n: stats.n || 0 })
  if (toy !== 'smash' && stats.n) return t(`share_${toy}_stat`, { n: stats.n })
  return t(`share_${toy}`)
}

export interface Network {
  id: string
  label: string
  href: (url: string, text: string) => string
}

const e = encodeURIComponent
export const NETWORKS: Network[] = [
  { id: 'x', label: 'X', href: (u, s) => `https://twitter.com/intent/tweet?text=${e(s)}&url=${e(u)}` },
  { id: 'facebook', label: 'Facebook', href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${e(u)}` },
  { id: 'whatsapp', label: 'WhatsApp', href: (u, s) => `https://wa.me/?text=${e(`${s} ${u}`)}` },
  { id: 'telegram', label: 'Telegram', href: (u, s) => `https://t.me/share/url?url=${e(u)}&text=${e(s)}` },
  { id: 'line', label: 'LINE', href: (u) => `https://social-plugins.line.me/lineit/share?url=${e(u)}` },
  { id: 'weibo', label: '微博 Weibo', href: (u, s) => `https://service.weibo.com/share/share.php?url=${e(u)}&title=${e(s)}` },
  { id: 'reddit', label: 'Reddit', href: (u, s) => `https://www.reddit.com/submit?url=${e(u)}&title=${e(s)}` },
]
