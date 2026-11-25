// Social sharing: a small stats store the games write into, and the share payload/links.
import { t, type ToyId } from './i18n'

/** Best moment of this visit, written by the game, read when sharing. */
export const stats: { n?: number; words?: string[] } = {}

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

// ---------- payload ----------

export function shareUrl(toy: ToyId): string {
  const base = `https://${toy}.integ.life/`
  if ((toy === 'smash' || toy === 'knock') && stats.words?.length) return `${base}?w=${encodeWords(stats.words)}`
  return base
}

export function shareText(toy: ToyId): string {
  if (toy === 'smash' && stats.words?.length) return t('share_smash_words', { w: stats.words.join(', ') })
  if (toy === 'knock' && stats.words?.length) return t('share_knock_words', { w: stats.words.join(', ') })
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
