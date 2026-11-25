// Void Harvest: this toy's own interface text in five languages (toy-specific, not a shared file).
// The text every toy shares (names for the More menu, Share, About) lives in i18n.ts.

const en = {
  void_tag: "Someone swallowed Monday in {s}s. You?",
  desc_void: "Hundreds of jittery shapes, and your cursor is a black hole. Spiral them in as the notes climb, and clear the screen in five seconds. A tiny stress-relief toy, no sign-up.",
  hint_void: "Move the black hole · eat everything · tap for sound",
  void_fast: "⚡ {t}s speed clear",
  hint_void_touch: "Drag the black hole · eat everything",
  share_void: "🕳️ Be a black hole and swallow the whole screen:",
  share_void_stat: "🕳️ I cleared the screen in {n}s. Can you beat that?",
}

const zhCN: typeof en = {
  void_tag: "有人 {s} 秒吞掉了周一。你呢？",
  desc_void: "满屏几百个乱抖的方块，你的光标是黑洞。所过之处螺旋吸入、音阶一路爬升，5 秒清屏。打开即玩的解压小玩具。",
  hint_void: "移动黑洞吸光一切 · 点一下开声音",
  void_fast: "⚡ {t}s 极速清屏",
  hint_void_touch: "拖动黑洞 · 吸光一切",
  share_void: "🕳️ 变成黑洞，把整个屏幕吸干净：",
  share_void_stat: "🕳️ 我 {n} 秒吸光了整个屏幕，你能更快吗？",
}

const es: typeof en = {
  void_tag: "Alguien se tragó el lunes en {s} s. ¿Y tú?",
  desc_void: "Cientos de figuras temblorosas y tu cursor es un agujero negro. Atrápalas en espiral mientras suben las notas y limpia la pantalla en cinco segundos. Un juguete antiestrés, sin registro.",
  hint_void: "Mueve el agujero negro · trágatelo todo · toca para activar el sonido",
  void_fast: "⚡ limpieza en {t}s",
  hint_void_touch: "Arrastra el agujero negro · trágatelo todo",
  share_void: "🕳️ Sé un agujero negro y trágate toda la pantalla:",
  share_void_stat: "🕳️ He limpiado la pantalla en {n} s. ¿Puedes superarlo?",
}

const fr: typeof en = {
  void_tag: "Quelqu’un a avalé lundi en {s} s. Et vous ?",
  desc_void: "Des centaines de formes qui tremblent, et ton curseur est un trou noir. Aspire-les en spirale pendant que les notes montent, et vide l'écran en cinq secondes. Un petit jouet anti-stress, sans inscription.",
  hint_void: "Déplace le trou noir · avale tout · touche pour le son",
  void_fast: "⚡ écran vidé en {t}s",
  hint_void_touch: "Fais glisser le trou noir · avale tout",
  share_void: "🕳️ Deviens un trou noir et avale tout l’écran :",
  share_void_stat: "🕳️ J’ai vidé l’écran en {n} s. Tu fais mieux ?",
}

const ja: typeof en = {
  void_tag: "誰かが {s} 秒で月曜日を吸い込みました。あなたは？",
  desc_void: "画面を埋めつくす何百ものブルブル図形。カーソルはブラックホール。音階を上げながら渦巻きで吸い込み、5 秒で全消し。登録不要のストレス解消おもちゃ。",
  hint_void: "ブラックホールを動かして全部吸い込め · タップで音が出ます",
  void_fast: "⚡ {t} 秒で全消し",
  hint_void_touch: "ブラックホールをドラッグして全部吸い込め",
  share_void: "🕳️ ブラックホールになって画面を全部吸い込もう：",
  share_void_stat: "🕳️ {n} 秒で全消しした。超えられる？",
}

export default { en, 'zh-CN': zhCN, es, fr, ja }
