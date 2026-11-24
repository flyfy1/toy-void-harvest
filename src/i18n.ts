// Interface text for all four toys (shared file, copied into each repo).
// Five major languages, picked from the browser's language list; anything else falls back to English. Arcade shouts (CRITICAL!, CLEAR!, CHAIN, OVERDRIVE) stay English on purpose.

export const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
] as const

export type Locale = (typeof LOCALES)[number]['code']
export type ToyId = 'charge' | 'void' | 'smash' | 'pop'

const en = {
  name_charge: 'Charge Burst',
  name_void: 'Void Harvest',
  name_smash: 'Glass Smash',
  name_pop: 'Chain Pop',
  desc_charge: 'Hold to charge, release to detonate. Full in two seconds: screen shake, hit-stop, sub-bass and a screen full of sparks. A tiny stress-relief toy, no sign-up.',
  desc_void: 'Hundreds of jittery shapes, and your cursor is a black hole. Spiral them in as the notes climb, and clear the screen in five seconds. A tiny stress-relief toy, no sign-up.',
  desc_smash: 'A pane of tempered glass with the word you hate on it. Smash it. Ten fast hits and it bursts into slow-motion shards. A tiny stress-relief toy, no sign-up.',
  desc_pop: 'A wall of bouncy neon bubbles. Pop five in 1.5 seconds for OVERDRIVE, then one tap sets off a full-screen chain reaction. A tiny stress-relief toy, no sign-up.',
  hint_charge: 'Hold to charge · release to blast · tap fast for chains',
  hint_void: 'Move the black hole · eat everything · tap for sound',
  hint_smash: 'Tap to smash · hit fast to shatter it all',
  hint_pop: 'Pop bubbles · 5 fast pops = OVERDRIVE',
  void_fast: '⚡ {t}s speed clear',
  smash_placeholder: '✎ Type what annoys you',
  smash_count: '{n} panes smashed',
  smash_words: ['BUG', 'MONDAY', 'OVERTIME', 'DEADLINE', 'MEETINGS', 'KPI', 'TAXES', 'SPAM'],
  pop_armed: 'OVERDRIVE · tap anywhere to detonate',
  more_games: 'More games · games.integ.life →',
}
export type Messages = typeof en

const zhCN: Messages = {
  name_charge: '蓄力核爆',
  name_void: '黑洞收割',
  name_smash: '暴力碎屏',
  name_pop: '连锁泡泡',
  desc_charge: '按住蓄力，松手核爆。2 秒蓄满，震屏、顿帧、重低音、满屏粒子。打开即玩的解压小玩具。',
  desc_void: '满屏几百个乱抖的方块，你的光标是黑洞。所过之处螺旋吸入、音阶一路爬升，5 秒清屏。打开即玩的解压小玩具。',
  desc_smash: '一块钢化玻璃，上面写着让你烦的词：BUG、加班、暴跌……砸它。连击十下整块炸成碎片慢动作飘落。打开即玩的解压小玩具。',
  desc_pop: '满屏霓虹泡泡，Q 弹捏破。1.5 秒连点 5 个进入 OVERDRIVE，下一击引爆全屏连锁大爆炸。打开即玩的解压小玩具。',
  hint_charge: '按住蓄力 · 松手引爆 · 狂点连环炸',
  hint_void: '移动黑洞吸光一切 · 点一下开声音',
  hint_smash: '点击砸玻璃 · 连砸十下整块粉碎',
  hint_pop: '点破泡泡 · 连点 5 个进入超载',
  void_fast: '⚡ {t}s 极速清屏',
  smash_placeholder: '✎ 换成让你烦的词',
  smash_count: '已砸碎 {n} 块',
  smash_words: ['BUG', '加班', '周一', 'KPI', '暴跌', 'DEADLINE', '改需求', '内卷'],
  pop_armed: 'OVERDRIVE · 点任意处引爆',
  more_games: '更多游戏 · games.integ.life →',
}

const es: Messages = {
  name_charge: 'Carga Explosiva',
  name_void: 'Agujero Negro',
  name_smash: 'Rompe el Cristal',
  name_pop: 'Burbujas en Cadena',
  desc_charge: 'Mantén pulsado para cargar y suelta para detonar. Carga completa en dos segundos: temblor, pausa de impacto, subgraves y chispas por toda la pantalla. Un juguete antiestrés, sin registro.',
  desc_void: 'Cientos de figuras temblorosas y tu cursor es un agujero negro. Atrápalas en espiral mientras suben las notas y limpia la pantalla en cinco segundos. Un juguete antiestrés, sin registro.',
  desc_smash: 'Un cristal templado con la palabra que odias. Rómpelo. Diez golpes rápidos y estalla en pedazos a cámara lenta. Un juguete antiestrés, sin registro.',
  desc_pop: 'Un muro de burbujas de neón. Revienta cinco en 1,5 segundos para activar OVERDRIVE y un toque desata una reacción en cadena. Un juguete antiestrés, sin registro.',
  hint_charge: 'Mantén para cargar · suelta para explotar · toca rápido para encadenar',
  hint_void: 'Mueve el agujero negro · trágatelo todo · toca para activar el sonido',
  hint_smash: 'Toca para golpear · golpea rápido para romperlo todo',
  hint_pop: 'Revienta burbujas · 5 seguidas = OVERDRIVE',
  void_fast: '⚡ limpieza en {t}s',
  smash_placeholder: '✎ Escribe lo que te molesta',
  smash_count: '{n} cristales rotos',
  smash_words: ['LUNES', 'BUG', 'HORAS EXTRA', 'REUNIÓN', 'DEADLINE', 'IMPUESTOS', 'ATASCO', 'SPAM'],
  pop_armed: 'OVERDRIVE · toca donde quieras para detonar',
  more_games: 'Más juegos · games.integ.life →',
}

const fr: Messages = {
  name_charge: 'Charge Explosive',
  name_void: 'Trou Noir',
  name_smash: 'Casse la Vitre',
  name_pop: 'Bulles en Chaîne',
  desc_charge: "Maintiens pour charger, relâche pour exploser. Pleine charge en deux secondes : tremblement, arrêt sur impact, infrabasses et une pluie d'étincelles. Un petit jouet anti-stress, sans inscription.",
  desc_void: "Des centaines de formes qui tremblent, et ton curseur est un trou noir. Aspire-les en spirale pendant que les notes montent, et vide l'écran en cinq secondes. Un petit jouet anti-stress, sans inscription.",
  desc_smash: "Une vitre trempée avec le mot que tu détestes. Casse-la. Dix coups rapides et elle vole en éclats au ralenti. Un petit jouet anti-stress, sans inscription.",
  desc_pop: "Un mur de bulles néon. Éclate-en cinq en 1,5 seconde pour l'OVERDRIVE, puis un seul tap déclenche une réaction en chaîne. Un petit jouet anti-stress, sans inscription.",
  hint_charge: 'Maintiens pour charger · relâche pour exploser · tape vite pour enchaîner',
  hint_void: 'Déplace le trou noir · avale tout · touche pour le son',
  hint_smash: 'Touche pour frapper · frappe vite pour tout briser',
  hint_pop: 'Éclate les bulles · 5 d’affilée = OVERDRIVE',
  void_fast: '⚡ écran vidé en {t}s',
  smash_placeholder: '✎ Écris ce qui t’énerve',
  smash_count: '{n} vitres cassées',
  smash_words: ['LUNDI', 'BUG', 'RÉUNION', 'HEURES SUP', 'DEADLINE', 'IMPÔTS', 'BOUCHONS', 'SPAM'],
  pop_armed: 'OVERDRIVE · touche n’importe où pour exploser',
  more_games: 'Plus de jeux · games.integ.life →',
}





const ja: Messages = {
  name_charge: 'チャージバースト',
  name_void: 'ブラックホール',
  name_smash: 'ガラス粉砕',
  name_pop: '連鎖バブル',
  desc_charge: '長押しでチャージ、離して大爆発。2 秒でフルチャージ、画面揺れ・ヒットストップ・重低音・画面いっぱいの火花。登録不要のストレス解消おもちゃ。',
  desc_void: '画面を埋めつくす何百ものブルブル図形。カーソルはブラックホール。音階を上げながら渦巻きで吸い込み、5 秒で全消し。登録不要のストレス解消おもちゃ。',
  desc_smash: 'ムカつく言葉が書かれた強化ガラス。叩き割ろう。素早く 10 連打でスローモーションで粉々に。登録不要のストレス解消おもちゃ。',
  desc_pop: 'ぷにぷにのネオンバブルの壁。1.5 秒で 5 個割ると OVERDRIVE、次のタップで画面全体が連鎖大爆発。登録不要のストレス解消おもちゃ。',
  hint_charge: '長押しでチャージ · 離して爆発 · 連打で連鎖',
  hint_void: 'ブラックホールを動かして全部吸い込め · タップで音が出ます',
  hint_smash: 'タップで叩く · 連打でガラスを粉々に',
  hint_pop: 'バブルを割ろう · 素早く 5 個で OVERDRIVE',
  void_fast: '⚡ {t} 秒で全消し',
  smash_placeholder: '✎ ムカつく言葉を入力',
  smash_count: '{n} 枚粉砕',
  smash_words: ['残業', '月曜日', 'バグ', '締め切り', '会議', 'ノルマ', '満員電車', '上司'],
  pop_armed: 'OVERDRIVE · どこでもタップで起爆',
  more_games: 'その他のゲーム · games.integ.life →',
}


const TABLE: Record<Locale, Messages> = { en, 'zh-CN': zhCN, es, fr, ja }

function match(raw: string | null | undefined): Locale | null {
  if (!raw) return null
  const v = raw.toLowerCase()
  if (v.startsWith('zh')) return 'zh-CN'
  const hit = LOCALES.find((l) => l.code.toLowerCase() === v || v.startsWith(l.code.toLowerCase() + '-'))
  return hit ? hit.code : null
}

function detect(): Locale {
  for (const l of navigator.languages?.length ? navigator.languages : [navigator.language]) {
    const m = match(l)
    if (m) return m
  }
  return 'en'
}

export const locale: Locale = detect()
const M = TABLE[locale]

type StringKey = { [K in keyof Messages]: Messages[K] extends string ? K : never }[keyof Messages]

export function t(key: StringKey, vars: Record<string, string | number> = {}): string {
  return M[key].replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}

export const smashWords = (): readonly string[] => M.smash_words

/** Localised <html lang>, <title> and description for the current toy. */
export function applyMeta(toy: ToyId) {
  document.documentElement.lang = locale
  const name = M[`name_${toy}`]
  document.title = locale === 'en' ? `${name} · integ.life` : `${name} · ${en[`name_${toy}`]}`
  document.querySelector('meta[name="description"]')?.setAttribute('content', M[`desc_${toy}`])
}
