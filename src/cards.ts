// The documents as data, the share lines and the share-sheet copy (loaded on demand with the sheet).
// A document: title, two to four rows, a verdict, one line of small print, the call line by the QR.
// WP1 fills knock (功德结算单) and the default document every toy falls back to.
import { locale, tx, type Locale, type ToyId } from './i18n'
import { MINE, bunQuery, canon, catQuery, encodeWords, hopOut, landing, live, stats, store, type Method, type Peak } from './share'

export interface Look {
  surface: [string, string]
  grain: string
  paper: string
  ink: string
  faint: string
  accent: string
  accent2: string
}
export interface Doc {
  look: Look
  title: string
  seal?: string
  rows: [string, string][]
  /** where the snapshot's centre of interest is, top 0 to bottom 1 (default 0.5) */
  focus?: number
  verdict: string
  small: string
  call: string
  host: string
}

// ---------- copy ----------

const SHEET = {
  en: {
    heading: 'Send it to someone who gets it',
    primary: 'Send to a friend',
    reply: 'Your turn back',
    link: 'Link only',
    save: 'Save image',
    hold: 'Press and hold the picture to send or save',
    shot: 'Cannot save? A screenshot works too',
    copy_image: 'Copy image',
    copy_link: 'Copy link',
    copied: 'Copied. Go and paste it.',
    download: 'Download',
    close: 'Close',
    call: 'Scan to take your turn',
  },
  'zh-CN': {
    heading: '发给一个懂的人',
    primary: '发给朋友',
    reply: '回敬一下',
    link: '只发链接',
    save: '保存图片',
    hold: '长按图片，发给朋友或保存',
    shot: '保存不了？直接截图也行',
    copy_image: '复制图片',
    copy_link: '复制链接',
    copied: '已复制，去粘贴吧',
    download: '下载',
    close: '关闭',
    call: '长按识别，回敬一下',
  },
  es: {
    heading: 'Mándaselo a alguien que lo pille',
    primary: 'Enviar a un amigo',
    reply: 'Ahora te toca a ti',
    link: 'Solo el enlace',
    save: 'Guardar imagen',
    hold: 'Mantén pulsada la imagen para enviarla o guardarla',
    shot: '¿No se guarda? Una captura también vale',
    copy_image: 'Copiar imagen',
    copy_link: 'Copiar enlace',
    copied: 'Copiado. Ahora pégalo.',
    download: 'Descargar',
    close: 'Cerrar',
    call: 'Escanea y te toca a ti',
  },
  fr: {
    heading: 'À envoyer à quelqu’un qui comprendra',
    primary: 'Envoyer à un ami',
    reply: 'À vous de renvoyer',
    link: 'Juste le lien',
    save: 'Enregistrer l’image',
    hold: 'Appuyez longuement sur l’image pour l’envoyer ou l’enregistrer',
    shot: 'Ça ne s’enregistre pas ? Une capture d’écran marche aussi',
    copy_image: 'Copier l’image',
    copy_link: 'Copier le lien',
    copied: 'Copié. Il ne reste qu’à coller.',
    download: 'Télécharger',
    close: 'Fermer',
    call: 'Scannez : à vous de jouer',
  },
  ja: {
    heading: 'わかってくれる人に送ろう',
    primary: '友だちに送る',
    reply: 'お返しする',
    link: 'リンクだけ',
    save: '画像を保存',
    hold: '画像を長押しして送信・保存',
    shot: '保存できない？スクショでもOK',
    copy_image: '画像をコピー',
    copy_link: 'リンクをコピー',
    copied: 'コピーしました。貼りつけてどうぞ。',
    download: 'ダウンロード',
    close: '閉じる',
    call: '読み取って、お返しを',
  },
} satisfies Record<Locale, Record<string, string>>
export const S = SHEET[locale]
export const fileName = (toy: ToyId) => `${toy}-integ-life.png`

/** knock: 功德结算单 / Merit Statement. {n} is today's count, by hand and outsourced together. */
const KNOCK = {
  en: {
    title: 'Merit Statement',
    seal: 'MERIT',
    today: ['Merit today', '+{n}'],
    sticks: ['Incense burned', '{s} sticks'],
    sticks1: ['Incense burned', '1 stick'],
    words: ['Itemised', '“{w}” × {n}'],
    auto: ['Outsourced', '{m}'],
    fast: ['Told to slow down', '{k}'],
    v0: '“Not open for business yet”',
    v1: '“Last-minute believer”',
    v2: '“Casually devout”',
    v3: '“Office bodhisattva”',
    v4: '“Infinite merit (digital only)”',
    small: 'Merit is non-refundable and cannot be exchanged for annual leave.',
    done: 'I knocked through {s} sticks of incense. Merit +{n}. I lit one for you:',
    done1: 'I knocked through a stick of incense. Merit +{n}. I lit one for you:',
    invite: 'Someone lit a stick of incense for you. One knock, merit +1:',
    reply: 'Light one back',
  },
  'zh-CN': {
    title: '功德结算单',
    seal: '功德',
    today: ['今日功德', '+{n}'],
    sticks: ['烧完香', '{s} 炷'],
    sticks1: ['烧完香', '1 炷'],
    words: ['明细', '「{w}」× {n}'],
    auto: ['外包代敲', '{m} 下'],
    fast: ['手速过快被提醒', '{k} 次'],
    v0: '「尚未开张」',
    v1: '「临时抱佛脚」',
    v2: '「佛系打工人」',
    v3: '「工位活菩萨」',
    v4: '「功德无量（仅限电子）」',
    small: '功德不可提现，不可抵扣加班。',
    done: '我敲完了 {s} 炷香，功德 +{n}。给你也点了一炷，敲吧：',
    done1: '我敲完了 1 炷香，功德 +{n}。给你也点了一炷，敲吧：',
    invite: '有人给你点了一炷香。敲一下，功德 +1：',
    reply: '回敬一炷',
  },
  es: {
    title: 'Extracto de méritos',
    seal: 'MÉRITO',
    today: ['Méritos hoy', '+{n}'],
    sticks: ['Incienso quemado', '{s} varitas'],
    sticks1: ['Incienso quemado', '1 varita'],
    words: ['Desglose', '«{w}» × {n}'],
    auto: ['Subcontratado', '{m}'],
    fast: ['Avisos por ir deprisa', '{k}'],
    v0: '«Aún sin abrir al público»',
    v1: '«Creyente de última hora»',
    v2: '«Devoto, pero sin agobios»',
    v3: '«Bodhisattva de oficina»',
    v4: '«Mérito infinito (solo digital)»',
    small: 'Los méritos no se reembolsan ni se canjean por días de vacaciones.',
    done: 'Me he fundido {s} varitas de incienso. Mérito +{n}. Te he encendido una:',
    done1: 'Me he fundido una varita de incienso. Mérito +{n}. Te he encendido otra:',
    invite: 'Alguien te ha encendido una varita de incienso. Un golpe, mérito +1:',
    reply: 'Devuélvele una varita',
  },
  fr: {
    title: 'Relevé de mérites',
    seal: 'MÉRITE',
    today: ['Mérite du jour', '+{n}'],
    sticks: ['Encens brûlé', '{s} bâtons'],
    sticks1: ['Encens brûlé', '1 bâton'],
    words: ['Détail', '« {w} » × {n}'],
    auto: ['Sous-traité', '{m}'],
    fast: ['Rappels : trop vite', '{k}'],
    v0: '« Pas encore ouvert au public »',
    v1: '« Croyant de dernière minute »',
    v2: '« Pieux, mais détendu »',
    v3: '« Bodhisattva de bureau »',
    v4: '« Mérite infini (numérique uniquement) »',
    small: 'Mérite non remboursable, non convertible en jours de congé.',
    done: 'J’ai brûlé {s} bâtons d’encens. Mérite +{n}. J’en ai allumé un pour vous :',
    done1: 'J’ai brûlé un bâton d’encens. Mérite +{n}. J’en ai allumé un pour vous :',
    invite: 'Quelqu’un a allumé un bâton d’encens pour vous. Un coup, mérite +1 :',
    reply: 'Rendre la pareille',
  },
  ja: {
    title: '功徳明細書',
    seal: '功徳',
    today: ['本日の功徳', '+{n}'],
    sticks: ['燃やした線香', '{s} 本'],
    sticks1: ['燃やした線香', '1 本'],
    words: ['内訳', '「{w}」× {n}'],
    auto: ['外注', '{m} 回'],
    fast: ['叩きすぎ注意', '{k} 回'],
    v0: '「まだ開店前」',
    v1: '「駆け込み信心」',
    v2: '「ゆるふわ信者」',
    v3: '「デスクの生き菩薩」',
    v4: '「功徳無量（デジタル限定）」',
    small: '功徳は換金できません。有給休暇にも換えられません。',
    done: '線香 {s} 本ぶん叩きました。功徳 +{n}。あなたの分も一本つけておきました：',
    done1: '線香 1 本ぶん叩きました。功徳 +{n}。あなたの分も一本つけておきました：',
    invite: 'あなたのために線香が一本。ひと叩きで功徳 +1：',
    reply: '一本お返し',
  },
} satisfies Record<Locale, Record<string, string | string[]>>

// ---------- looks (the toy's own surface and paper) ----------

const DARK: Look = { surface: ['#1b1b22', '#0c0c12'], grain: 'rgba(255,255,255,0.025)', paper: '#F7F4EC', ink: '#22201C', faint: 'rgba(34,32,28,0.5)', accent: '#22201C', accent2: 'rgba(34,32,28,0.35)' }
const LOOKS: Partial<Record<ToyId, Look>> = {
  knock: { surface: ['#2a1a10', '#120b06'], grain: 'rgba(255,214,160,0.035)', paper: '#FBF3E2', ink: '#3A1A0C', faint: 'rgba(58,26,12,0.5)', accent: '#9E1B1B', accent2: '#C9A24A' },
  charge: { surface: ['#0d2a3a', '#05121b'], grain: 'rgba(160,220,255,0.03)', paper: '#F4F7F8', ink: '#1D2A30', faint: 'rgba(29,42,48,0.5)', accent: '#C0392B', accent2: 'rgba(29,42,48,0.3)' },
  void: DARK,
  smash: { ...DARK, accent: '#B3261E' },
  pop: { surface: ['#C9A77A', '#A8835A'], grain: 'rgba(90,60,30,0.08)', paper: '#FFFDF7', ink: '#1E1E1E', faint: 'rgba(30,30,30,0.5)', accent: '#1E1E1E', accent2: 'rgba(30,30,30,0.3)' },
  purr: { surface: ['#E4CFB6', '#D6BD9F'], grain: 'rgba(120,84,56,0.08)', paper: '#FFFCF5', ink: '#3B2E24', faint: 'rgba(59,46,36,0.5)', accent: '#3B2E24', accent2: 'rgba(59,46,36,0.3)' },
  squish: { surface: ['#FBE1E6', '#F1CDD4'], grain: 'rgba(160,90,100,0.06)', paper: '#FFFBF3', ink: '#5A3B2A', faint: 'rgba(90,59,42,0.5)', accent: '#6B4A2E', accent2: 'rgba(107,74,46,0.3)' },
  scratch: { surface: ['#1d4a38', '#0f2a20'], grain: 'rgba(255,255,255,0.03)', paper: '#FFF8E7', ink: '#2A2418', faint: 'rgba(42,36,24,0.5)', accent: '#8A6A12', accent2: 'rgba(138,106,18,0.4)' },
  peel: { surface: ['#ECE7DF', '#DCD5CA'], grain: 'rgba(80,70,60,0.05)', paper: '#FFFFFF', ink: '#26302A', faint: 'rgba(38,48,42,0.5)', accent: '#2E7D32', accent2: 'rgba(46,125,50,0.35)' },
}
const look = (toy: ToyId) => LOOKS[toy] ?? LOOKS.purr!

// ---------- the link and the author ----------


export function shareUrl(toy: ToyId, method?: Method): string {
  const base = `https://${toy}.integ.life/`
  let q = ''
  if ((toy === 'smash' || toy === 'knock' || toy === 'scratch' || toy === 'stamp') && stats.words?.length) q = `?w=${encodeWords(stats.words)}`
  else if (toy === 'purr') q = catQuery(stats.name || '', stats.coat || '')
  else if (toy === 'squish') q = bunQuery(stats.name || '', stats.skin || '')
  if (method) q += `${q ? '&' : '?'}r=${method}${hopOut()}`
  return base + q
}


/** The words / name in the address bar were written on this device (so they may go on a card). */
export function authored(): boolean {
  try {
    const c = canon(location.search)
    return !!c && c === (localStorage.getItem(MINE) || '')
  } catch {
    return false
  }
}


// ---------- share text: done form once the peak was reached in this visit, invite form otherwise ----------

const strip = (s: string) => s.replace(/^\p{Extended_Pictographic}️?\s*/u, '')
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''))

export function shareText(toy: ToyId): string {
  const n = stats.n ?? 0
  const k = stats.k ?? 0
  const mine = authored()
  const words = stats.words?.length ? stats.words.join(', ') : ''
  switch (toy) {
    case 'knock': {
      const K = KNOCK[locale]
      const p = store.peak?.data
      if (!store.done || !p) return K.invite
      return fill(p.sticks === 1 ? K.done1 : K.done, { s: p.sticks, n: p.today })
    }
    case 'smash':
      return mine && words && n ? tx('share_smash_words', { w: words }) : tx('share_smash')
    case 'scratch':
      return mine && words ? tx('share_scratch_words') : n ? tx('share_scratch_stat', { n, k }) : tx('share_scratch')
    case 'stamp':
      return mine && words ? tx('share_stamp_words') : n ? tx('share_stamp_stat', { n, k }) : tx('share_stamp')
    case 'purr':
      return mine && stats.name ? tx('share_purr_name', { name: stats.name }) : tx('share_purr')
    case 'squish':
      return !n ? tx('share_squish') : mine && stats.name ? tx('share_squish_name', { name: stats.name, n }) : tx('share_squish_stat', { n })
    case 'pour':
      return !n ? tx('share_pour') : stats.last === 'golden' ? tx('share_pour_golden', { n }) : tx('share_pour_stat', { n, k })
    default:
      return (n && tx(`share_${toy}_stat`, { n })) || tx(`share_${toy}`)
  }
}

/** The label on the sheet's primary button: a recipient answers back. */
export const primaryLabel = (toy: ToyId) => (landing.recipient ? (toy === 'knock' ? KNOCK[locale].reply : S.reply) : S.primary)

/** Numbers that ride along on share_done (never user text). */
export const shareExtra = (toy: ToyId): Record<string, number> =>
  toy === 'knock' && stats.n
    ? { total: stats.n }
    : toy === 'squish' && stats.n
      ? { squeezes: stats.n }
      : toy === 'scratch'
        ? { cards: stats.n ?? 0, wins: stats.k ?? 0 }
        : toy === 'peel' && stats.n
          ? { peels: stats.n }
          : toy === 'pour'
            ? { total: stats.n ?? 0, golden: stats.k ?? 0 }
            : toy === 'stamp'
              ? { total: stats.n ?? 0, denied: stats.k ?? 0 }
              : toy === 'zip' && stats.n
                ? { total: stats.n }
                : {}

// ---------- the documents ----------

function knockDoc(p: Record<string, number> | null): Doc {
  const K = KNOCK[locale]
  const today = p?.today ?? 0
  const sticks = p?.sticks ?? 0
  const rows: [string, string][] = []
  if (today) rows.push([K.today[0], fill(K.today[1], { n: today })])
  if (sticks) rows.push(sticks === 1 ? [K.sticks1[0], K.sticks1[1]] : [K.sticks[0], fill(K.sticks[1], { s: sticks })])
  // the itemised line shows words only when they were typed on this device, never a sender's words
  const w = stats.words?.length && authored() ? stats.words.slice(0, 2).join('、') : ''
  if (w && p?.wordKnocks) rows.push([K.words[0], fill(K.words[1], { w: w.length > 14 ? w.slice(0, 13) + '…' : w, n: p.wordKnocks })])
  if (p?.auto) rows.push([K.auto[0], fill(K.auto[1], { m: p.auto })])
  if (p?.fast) rows.push([K.fast[0], fill(K.fast[1], { k: p.fast })])
  const verdict = !today ? K.v0 : today < 108 ? K.v1 : today < 324 ? K.v2 : today < 1080 ? K.v3 : K.v4
  return { look: look('knock'), title: K.title, seal: K.seal, rows: rows.slice(0, 4), focus: 0.5, verdict, small: K.small, call: S.call, host: 'knock.integ.life' }
}

/** Every toy without its own document yet: its name and its current share line. */
function defaultDoc(toy: ToyId): Doc {
  const line = strip(shareText(toy)).replace(/\s*[:：]\s*$/, '')
  const q = locale === 'zh-CN' || locale === 'ja' ? ['「', '」'] : locale === 'fr' ? ['« ', ' »'] : locale === 'es' ? ['«', '»'] : ['“', '”']
  return { look: look(toy), title: tx(`name_${toy}`), rows: [], verdict: q[0] + line + q[1], small: '', call: S.call, host: `${toy}.integ.life` }
}

export function buildDoc(toy: ToyId, peak: Peak | null): Doc {
  if (toy === 'knock') return knockDoc(peak?.data ?? live.data?.() ?? null)
  return defaultDoc(toy)
}
