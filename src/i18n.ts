// Interface text for all the toys (shared file, copied into each repo).
// Five major languages, picked from the browser's language list; anything else falls back to English. Arcade shouts (CRITICAL!, CLEAR!, CHAIN, OVERDRIVE) stay English on purpose.

export const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
] as const

export type Locale = (typeof LOCALES)[number]['code']
export type ToyId = 'charge' | 'void' | 'smash' | 'pop' | 'knock' // | 'purr' (Lap Cat, purr.integ.life): add once it is live

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
  smash_placeholder: '✎ Annoying words, comma-separated',
  smash_count: '{n} panes smashed',
  smash_words: ['MONDAY', 'DEADLINE', 'BUG', 'MEETINGS', 'OVERTIME', 'REPLY ALL', 'TRAFFIC', 'TAXES', 'RENT', 'SPAM', 'CAPTCHA', 'LOW BATTERY', 'POP-UP ADS', 'KPI'],
  pop_armed: 'OVERDRIVE · tap anywhere to detonate',
  more_games: 'More games · games.integ.life →',
  about: 'How to play',
  share: 'Share',
  copy_link: 'Copy link',
  copied: 'Link copied!',
  scan: 'Scan to open on a phone, or to share in WeChat',
  share_heading: 'Share with friends',
  share_charge: '💥 Hold, charge, detonate. The most satisfying button on the internet:',
  share_charge_stat: '💥 I went CRITICAL {n} times. Your turn:',
  share_void: '🕳️ Be a black hole and swallow the whole screen:',
  share_void_stat: '🕳️ I cleared the screen in {n}s. Can you beat that?',
  share_smash: '🔨 Write the word you hate on glass, then smash it:',
  share_smash_words: '🔨 I just smashed “{w}” to pieces. Smash them with me:',
  share_pop: '🫧 Pop 5 fast, then blow up the whole screen:',
  share_pop_stat: '🫧 I set off a ×{n} bubble chain. Your turn:',
  name_knock: "Knock on Wood",
  desc_knock: "A lacquered wooden fish and a mallet. Every tap is a warm wooden tok and +1 merit, or +1 of whatever you type. Counts are kept on your device. A tiny calming toy, no sign-up.",
  hint_knock: "Tap anywhere to knock",
  share_knock: "🪵 Tap a wooden fish. Merit +1:",
  share_knock_stat: "🪵 I have knocked on wood {n} times. Merit +{n}. Your turn:",
  share_knock_words: "🪵 Every knock on this fish is “{w}”. Knock with me:",
  knock_placeholder: "✎ Your own text, e.g. KPI -1, Rent -1",
  knock_label: "Luck",
  knock_today: "today +{n}",
  knock_default: "Luck +1",
  knock_variants: ["Bugs -1", "Monday -1", "Deadline -1", "Worries -1"],
  knock_auto_off: "Outsource my merit",
  knock_auto_on: "Outsourced · {r}/s",
  knock_proxy: "Merit by proxy: 0",
  knock_fast: "Sincerity not detected.",
  knock_m18: "Warming up.",
  knock_m108: "A full set of 108. Enlightenment pending.",
  knock_m1000: "Your karma has been escalated to management.",
  knock_m10000: "10,000. The fish would like a day off.",
  knock_big_unlock: "Unlocked: the big fish. Deeper tok.",
  knock_big: "Big fish",
  knock_small: "Small fish",
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
  smash_placeholder: '✎ 烦人的词，用逗号分隔',
  smash_count: '已砸碎 {n} 块',
  smash_words: ['加班', '周一', 'BUG', 'KPI', '改需求', '甲方', '内卷', '周报', '已读不回', '早高峰', '房贷', '调休', '暴跌', '催婚'],
  pop_armed: 'OVERDRIVE · 点任意处引爆',
  more_games: '更多游戏 · games.integ.life →',
  about: '玩法说明',
  share: '分享',
  copy_link: '复制链接',
  copied: '链接已复制！',
  scan: '手机扫码打开，或扫码分享到微信',
  share_heading: '分享给朋友',
  share_charge: '💥 按住蓄力，松手核爆。全网最解压的一个按钮：',
  share_charge_stat: '💥 我刚刚核爆了 {n} 次，你也来：',
  share_void: '🕳️ 变成黑洞，把整个屏幕吸干净：',
  share_void_stat: '🕳️ 我 {n} 秒吸光了整个屏幕，你能更快吗？',
  share_smash: '🔨 把让你烦的词写在玻璃上，然后砸碎它：',
  share_smash_words: '🔨 我刚把「{w}」砸得粉碎，一起来砸：',
  share_pop: '🫧 连点 5 个泡泡，然后引爆整个屏幕：',
  share_pop_stat: '🫧 我引爆了 ×{n} 连锁泡泡，你也来：',
  name_knock: "电子木鱼",
  desc_knock: "一只上了漆的木鱼，一根木槌。每敲一下，一声温润的“笃”，功德 +1，或者 +1 你自己写的任何东西。计数只存在你自己的设备上。打开即玩的解压小玩具。",
  hint_knock: "点任意处敲木鱼",
  share_knock: "🪵 敲一下电子木鱼，功德 +1：",
  share_knock_stat: "🪵 我已经敲了 {n} 下木鱼，功德 +{n}。你也来积点德：",
  share_knock_words: "🪵 这只木鱼每敲一下都是「{w}」，一起来敲：",
  knock_placeholder: "✎ 自定义飘字，逗号分隔，如 KPI -1",
  knock_label: "功德",
  knock_today: "今日 +{n}",
  knock_default: "功德 +1",
  knock_variants: ["烦恼 -1", "BUG -1", "周一 -1", "Deadline -1", "焦虑 -1"],
  knock_auto_off: "功德外包",
  knock_auto_on: "外包中 · {r} 下/秒",
  knock_proxy: "代敲不算",
  knock_fast: "心不诚。",
  knock_m18: "热身完毕。",
  knock_m108: "108 下，圆满。",
  knock_m1000: "功德已上报，等待审批。",
  knock_m10000: "一万下。木鱼申请调休。",
  knock_big_unlock: "解锁大木鱼，声音更沉。",
  knock_big: "大木鱼",
  knock_small: "小木鱼",
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
  smash_placeholder: '✎ Lo que te molesta (con comas)',
  smash_count: '{n} cristales rotos',
  smash_words: ['LUNES', 'HORAS EXTRA', 'REUNIONES', 'ATASCO', 'HACIENDA', 'ALQUILER', 'MADRUGAR', 'BUG', 'SPAM', 'CUÑADOS', 'DEADLINE', 'RESACA'],
  pop_armed: 'OVERDRIVE · toca donde quieras para detonar',
  more_games: 'Más juegos · games.integ.life →',
  about: 'Cómo jugar',
  share: 'Compartir',
  copy_link: 'Copiar enlace',
  copied: '¡Enlace copiado!',
  scan: 'Escanea para abrirlo en el móvil o compartirlo en WeChat',
  share_heading: 'Compartir con amigos',
  share_charge: '💥 Mantén, carga y detona. El botón más satisfactorio de internet:',
  share_charge_stat: '💥 He llegado a CRITICAL {n} veces. Te toca:',
  share_void: '🕳️ Sé un agujero negro y trágate toda la pantalla:',
  share_void_stat: '🕳️ He limpiado la pantalla en {n} s. ¿Puedes superarlo?',
  share_smash: '🔨 Escribe la palabra que odias en un cristal y rómpelo:',
  share_smash_words: '🔨 Acabo de hacer añicos «{w}». Rómpelo conmigo:',
  share_pop: '🫧 Revienta 5 rápido y haz estallar toda la pantalla:',
  share_pop_stat: '🫧 He provocado una cadena de ×{n} burbujas. Te toca:',
  name_knock: "Toca Madera",
  desc_knock: "Un pez de madera lacada y una maza. Cada toque es un tok cálido de madera y +1 de suerte, o +1 de lo que escribas. El contador se guarda en tu dispositivo. Un juguete relajante, sin registro.",
  hint_knock: "Toca donde quieras para golpear",
  share_knock: "🪵 Toca madera. Suerte +1:",
  share_knock_stat: "🪵 He tocado madera {n} veces. Suerte +{n}. Te toca:",
  share_knock_words: "🪵 Cada golpe a este pez es «{w}». Golpea conmigo:",
  knock_placeholder: "✎ Tu texto, p. ej. Lunes -1, Jefe -1",
  knock_label: "Suerte",
  knock_today: "hoy +{n}",
  knock_default: "Suerte +1",
  knock_variants: ["Lunes -1", "Bugs -1", "Deadline -1", "Agobios -1"],
  knock_auto_off: "Delegar suerte",
  knock_auto_on: "Delegada · {r}/s",
  knock_proxy: "Suerte delegada: 0",
  knock_fast: "Sinceridad no detectada.",
  knock_m18: "Calentando.",
  knock_m108: "108 golpes. Iluminación en trámite.",
  knock_m1000: "Tu karma ha sido escalado a dirección.",
  knock_m10000: "10.000. El pez pide un día libre.",
  knock_big_unlock: "Desbloqueado: el pez grande. Un tok más grave.",
  knock_big: "Pez grande",
  knock_small: "Pez pequeño",
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
  smash_placeholder: '✎ Ce qui t’énerve (virgules)',
  smash_count: '{n} vitres cassées',
  smash_words: ['LUNDI', 'RÉUNIONS', 'BOUCHONS', 'GRÈVE', 'IMPÔTS', 'LOYER', 'PAPERASSE', 'RER B', 'HEURES SUP', 'BUG', 'SPAM', 'DEADLINE'],
  pop_armed: 'OVERDRIVE · touche n’importe où pour exploser',
  more_games: 'Plus de jeux · games.integ.life →',
  about: 'Comment jouer',
  share: 'Partager',
  copy_link: 'Copier le lien',
  copied: 'Lien copié !',
  scan: 'Scanne pour l’ouvrir sur ton téléphone ou le partager sur WeChat',
  share_heading: 'Partager avec des amis',
  share_charge: '💥 Maintiens, charge, explose. Le bouton le plus satisfaisant d’internet :',
  share_charge_stat: '💥 J’ai fait CRITICAL {n} fois. À toi :',
  share_void: '🕳️ Deviens un trou noir et avale tout l’écran :',
  share_void_stat: '🕳️ J’ai vidé l’écran en {n} s. Tu fais mieux ?',
  share_smash: '🔨 Écris le mot que tu détestes sur une vitre, puis casse-la :',
  share_smash_words: '🔨 Je viens de réduire « {w} » en miettes. Viens casser avec moi :',
  share_pop: '🫧 Éclate-en 5 vite, puis fais sauter tout l’écran :',
  share_pop_stat: '🫧 J’ai déclenché une chaîne de ×{n} bulles. À toi :',
  name_knock: "Touche du Bois",
  desc_knock: "Un poisson en bois laqué et un maillet. Chaque tap est un tok de bois tout doux et +1 de chance, ou +1 de ce que tu écris. Le compteur reste sur ton appareil. Un petit jouet apaisant, sans inscription.",
  hint_knock: "Touche n’importe où pour frapper",
  share_knock: "🪵 Touche du bois. Chance +1 :",
  share_knock_stat: "🪵 J’ai touché du bois {n} fois. Chance +{n}. À toi :",
  share_knock_words: "🪵 Chaque coup sur ce poisson, c’est « {w} ». Frappe avec moi :",
  knock_placeholder: "✎ Ton texte, ex. Lundi -1, Loyer -1",
  knock_label: "Chance",
  knock_today: "aujourd’hui +{n}",
  knock_default: "Chance +1",
  knock_variants: ["Lundi -1", "Bugs -1", "Deadline -1", "Soucis -1"],
  knock_auto_off: "Sous-traiter",
  knock_auto_on: "Sous-traité · {r}/s",
  knock_proxy: "Chance déléguée : 0",
  knock_fast: "Sincérité non détectée.",
  knock_m18: "Échauffement terminé.",
  knock_m108: "108 coups. Illumination en attente.",
  knock_m1000: "Ton karma a été transmis à la direction.",
  knock_m10000: "10 000. Le poisson demande un jour de congé.",
  knock_big_unlock: "Débloqué : le grand poisson. Un tok plus grave.",
  knock_big: "Grand poisson",
  knock_small: "Petit poisson",
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
  smash_placeholder: '✎ ムカつく言葉（カンマ区切り）',
  smash_count: '{n} 枚粉砕',
  smash_words: ['残業', '月曜日', '満員電車', '締め切り', '会議', 'ノルマ', '上司', '飲み会', 'ハンコ', '稟議', 'バグ', 'サービス残業'],
  pop_armed: 'OVERDRIVE · どこでもタップで起爆',
  more_games: 'その他のゲーム · games.integ.life →',
  about: '遊び方',
  share: 'シェア',
  copy_link: 'リンクをコピー',
  copied: 'コピーしました！',
  scan: 'スマホで読み取って開く／WeChat でシェア',
  share_heading: '友だちにシェア',
  share_charge: '💥 長押しでチャージ、離して大爆発。ネットで一番気持ちいいボタン：',
  share_charge_stat: '💥 CRITICAL を {n} 回出した。次はあなた：',
  share_void: '🕳️ ブラックホールになって画面を全部吸い込もう：',
  share_void_stat: '🕳️ {n} 秒で全消しした。超えられる？',
  share_smash: '🔨 ムカつく言葉をガラスに書いて、叩き割ろう：',
  share_smash_words: '🔨 「{w}」を粉々にした。一緒に割ろう：',
  share_pop: '🫧 素早く 5 個割って、画面全体を連鎖爆発：',
  share_pop_stat: '🫧 ×{n} 連鎖バブルを起こした。次はあなた：',
  name_knock: "電子木魚 ぽくぽく",
  desc_knock: "漆塗りの木魚とバチ。タップするたびに、あたたかい木の音「ぽく」と功徳 +1。好きな言葉の +1 にもできます。回数は端末にだけ保存。登録不要の癒やしおもちゃ。",
  hint_knock: "どこでもタップでぽく",
  share_knock: "🪵 木魚をぽく。功徳 +1：",
  share_knock_stat: "🪵 木魚を {n} 回たたいた。功徳 +{n}。次はあなた：",
  share_knock_words: "🪵 この木魚、たたくたびに「{w}」。一緒にぽく：",
  knock_placeholder: "✎ 自分の言葉（カンマ区切り）例: 残業 -1",
  knock_label: "功徳",
  knock_today: "今日 +{n}",
  knock_default: "功徳 +1",
  knock_variants: ["煩悩 -1", "バグ -1", "月曜 -1", "締め切り -1"],
  knock_auto_off: "功徳を外注",
  knock_auto_on: "外注中 · 毎秒 {r} 回",
  knock_proxy: "代行の功徳：0",
  knock_fast: "誠意が感じられません。",
  knock_m18: "ウォームアップ完了。",
  knock_m108: "108 回、煩悩コンプリート。",
  knock_m1000: "功徳は上長に申請済みです。承認待ち。",
  knock_m10000: "一万回。木魚が有給を申請しました。",
  knock_big_unlock: "大きな木魚を解放。音が深くなる。",
  knock_big: "大きい木魚",
  knock_small: "小さい木魚",
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
export const knockVariants = (): readonly string[] => M.knock_variants

/** Localised <html lang>, <title> and description for the current toy. */
export function applyMeta(toy: ToyId) {
  document.documentElement.lang = locale
  const name = M[`name_${toy}`]
  document.title = locale === 'en' ? `${name} · integ.life` : `${name} · ${en[`name_${toy}`]}`
  document.querySelector('meta[name="description"]')?.setAttribute('content', M[`desc_${toy}`])
  const local = document.getElementById('about-local')
  if (local && locale !== 'en') {
    local.replaceChildren()
    const h = document.createElement('h2')
    h.textContent = name
    const p = document.createElement('p')
    p.textContent = M[`desc_${toy}`]
    const tip = document.createElement('p')
    tip.textContent = M[`hint_${toy}`]
    local.append(h, p, tip)
  }
}

/** The static About / FAQ article in index.html (crawlable text, shown on demand). */
export function openAbout(open = true) {
  document.body.classList.toggle('about-open', open)
}
