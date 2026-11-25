// Strings for the black-hole pass, kept local so this repo does not edit the shared i18n.ts.
// The lead merges these into the canonical i18n.ts later (same keys, same five locales).
import { locale, type Locale } from './i18n'

const S = {
  en: {
    void_back_sock: 'Returned: one sock. The other stays.',
    void_back_tie: 'Returned: 1 of your 400 hair ties.',
    void_back_bud: 'Returned: the left earbud. Battery: 0%.',
    void_back_umbrella: 'Returned: an umbrella. Not yours.',
    void_fast: '{t}s speed clear',
    void_monday: 'MON',
    void_client: 'CLIENT',
  },
  'zh-CN': {
    void_back_sock: '退回：袜子一只。另一只不退。',
    void_back_tie: '退回：发圈一根。其余 399 根继续保管。',
    void_back_bud: '退回：左耳机。电量 0%。',
    void_back_umbrella: '退回：雨伞一把。不是你的那把。',
    void_fast: '{t}s 极速清屏',
    void_monday: '周一',
    void_client: '甲方',
  },
  es: {
    void_back_sock: 'Devuelto: un calcetín. El otro se queda.',
    void_back_tie: 'Devuelto: 1 de tus 400 gomas del pelo.',
    void_back_bud: 'Devuelto: el auricular izquierdo. Batería: 0 %.',
    void_back_umbrella: 'Devuelto: un paraguas. No es el tuyo.',
    void_fast: 'limpieza en {t}s',
    void_monday: 'LUN',
    void_client: 'CLIENTE',
  },
  fr: {
    void_back_sock: "Rendu : une chaussette. L'autre reste.",
    void_back_tie: 'Rendu : 1 de tes 400 élastiques.',
    void_back_bud: "Rendu : l'écouteur gauche. Batterie : 0 %.",
    void_back_umbrella: 'Rendu : un parapluie. Pas le tien.',
    void_fast: 'écran vidé en {t}s',
    void_monday: 'LUN',
    void_client: 'CLIENT',
  },
  ja: {
    void_back_sock: '返却：靴下片方。もう片方は返さない。',
    void_back_tie: '返却：ヘアゴム 1 本。残り 399 本は預かり中。',
    void_back_bud: '返却：イヤホン左。残量 0%。',
    void_back_umbrella: '返却：傘 1 本。あなたのではない。',
    void_fast: '{t} 秒で全消し',
    void_monday: '月曜',
    void_client: '先方',
  },
} satisfies Record<Locale, Record<string, string>>

export type VoidKey = keyof (typeof S)['en']

export function vt(key: VoidKey, vars: Record<string, string | number> = {}): string {
  const table: Record<VoidKey, string> = (S as Record<string, Record<VoidKey, string>>)[locale] ?? S.en
  return table[key].replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}

/** CJK-aware canvas font stack (same as toy-glass-smash `FONT`). */
export const FONT =
  locale === 'ja' ? 'system-ui, "Hiragino Sans", "Noto Sans CJK JP", sans-serif' : 'system-ui, "PingFang SC", "Hiragino Sans", "Noto Sans CJK SC", sans-serif'
