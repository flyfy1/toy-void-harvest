/** One glyph per toy, same style as Icons.tsx (20 px, 1.75 px stroke, currentColor). A file of its own so the
 *  More menu's list of glyphs loads with the menu (MorePanel) and stays out of each toy's main bundle. */
import type { JSX } from 'react'
import type { LiveId } from '../i18n'

const S = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }

// ---------- one glyph per toy ----------

/** charge: a pufferfish puffed into a spiky ball (eye and tail, so it never reads as a sun). */
export const IconCharge = () => (
  <svg {...S}>
    <circle cx="10.5" cy="12" r="6" />
    <path d="m16.4 12 4.4-3.4v6.8Z" />
    <path d="M10.5 3.4V6M10.5 18v2.6M4.4 5.9l1.8 1.8M4.4 18.1l1.8-1.8M1.9 12h2.6M15.2 6.3l1-1.4M15.2 17.7l1 1.4" />
    <circle cx="8.3" cy="10.6" r="0.55" fill="currentColor" />
  </svg>
)
/** void: a dark ring with a tilted accretion ellipse. */
export const IconVoid = () => (
  <svg {...S}>
    <circle cx="12" cy="12" r="4.6" />
    <ellipse cx="12" cy="12" rx="9.6" ry="3.4" transform="rotate(-22 12 12)" />
  </svg>
)
/** smash: a pane with a crack running through it. */
export const IconSmash = () => (
  <svg {...S}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="m4 10.5 4.2 1.3 2.3-3.3 2.4 4.8 3.2-1.6L20 15" />
    <path d="m10.5 8.5-.9-4.5M12.9 13.3l-1.2 6.7" />
  </svg>
)
/** pop: three bubbles packed in a hex. */
export const IconPop = () => (
  <svg {...S}>
    <circle cx="8.3" cy="9" r="3.7" />
    <circle cx="15.7" cy="9" r="3.7" />
    <circle cx="12" cy="15.4" r="3.7" />
  </svg>
)
/** knock: the wooden fish, in outline. */
export const IconKnock = () => (
  <svg {...S}>
    <path d="M16 12c-1.9 3-4.4 4.9-7.6 4.9S3.6 15.1 2.6 12c1-3.1 3.2-4.9 5.8-4.9S14.1 9 16 12Zm0 0 5-3.8v7.6Z" />
    <circle cx="6.4" cy="11.2" r="0.55" fill="currentColor" />
    <path d="M10 9.4c.7 1.6.7 3.6 0 5.2" />
  </svg>
)
/** purr: a cat's head. */
export const IconPurr = () => (
  <svg {...S}>
    <path d="M5 9.5 4.6 3.8l4.5 3.1a8.6 8.6 0 0 1 5.8 0l4.5-3.1-.4 5.7c.7 1.1 1 2.3 1 3.6 0 4.2-3.6 7-8 7s-8-2.8-8-7c0-1.3.3-2.5 1-3.6Z" />
    <path d="M9.3 12.6v.6M14.7 12.6v.6M11 15.6l1 .7 1-.7" />
  </svg>
)

/** squish: a soft bun sitting on the table, with a tiny face. */
export const IconSquish = () => (
  <svg {...S}>
    <path d="M3.6 17.2c-.9-4.6 3-9.4 8.4-9.4s9.3 4.8 8.4 9.4c-.2 1-1 1.6-2 1.6H5.6c-1 0-1.8-.6-2-1.6Z" />
    <path d="M9.4 13.4v.4M14.6 13.4v.4M11 15.4c.3.5.7.5 1 0 .3.5.7.5 1 0" />
  </svg>
)

/** scratch: a card with a zigzag scratched through its panel. */
export const IconScratch = () => (
  <svg {...S}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M7.5 9.5 10 13l2.2-3.5 2.3 3.5 2-3.5" />
  </svg>
)

/** peel: a rounded rectangle with its corner folded back. */
export const IconPeel = () => (
  <svg {...S}>
    <path d="M13.5 20.5H7.5A2.5 2.5 0 0 1 5 18V6a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 19 6v8" />
    <path d="M19 14l-5.5 6.5" />
    <path d="M19 14c-2.6-.2-4.7.4-5.5 1.6-.6 1-.5 2.8 0 4.9" />
  </svg>
)

/** crunch: a ball with a three-way crack. */
export const IconCrunch = () => (
  <svg {...S}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M12 12 9.4 6.4M12 12l5.9 1.2M12 12l-1.6 6.1" />
  </svg>
)

/** pour: a tilted bottle neck over a glass. */
export const IconPour = () => (
  <svg {...S}>
    <path d="M14.2 3.2 21 6.8l-1.4 2.6-4.9-.6-3.3 1.6" />
    <path d="M14.2 3.2 11.4 10.4" />
    <path d="M6 13h9l-1 8H7z" />
    <path d="M10.5 11v1.5" />
  </svg>
)

/** stamp: a handle over a short bar. */
export const IconStamp = () => (
  <svg {...S}>
    <circle cx="12" cy="5.5" r="2.5" />
    <path d="M10.8 8v4.5M13.2 8v4.5" />
    <path d="M5.5 12.5h13v3.5h-13z" />
    <path d="M5 20h14" />
  </svg>
)

/** zip: a vertical line of teeth with a slider. */
export const IconZip = () => (
  <svg {...S}>
    <path d="M12 3v4M12 17v4" />
    <path d="M10 4.5h1.2M12.8 6h1.2M10 18h1.2M12.8 19.5h1.2" />
    <path d="M9.5 8h5l-.8 6h-3.4z" />
    <path d="M12 14v3" />
  </svg>
)

/** twirl: a skirt flaring out from its waistband. */
export const IconTwirl = () => (
  <svg {...S}>
    <path d="M9 5h6" />
    <path d="M9 5 3.5 17q8.5 3 17 0L15 5" />
    <path d="M12 5.5v13M9.5 6 7 18.5M14.5 6l2.5 12.5" />
  </svg>
)

/** yoink: a table, one cup left standing, the cloth flying off to the side. */
export const IconYoink = () => (
  <svg {...S}>
    <path d="M3 14h13M5 14v6m9-6v6M9 14v-3h4v3m3 0q3-1 5.5 2" />
  </svg>
)

/** silk: a rail with a curtain drawn back in soft folds beside a window pane. */
export const IconSilk = () => (
  <svg {...S}>
    <path d="M3 4h18M5 4q-1 8 1.5 16M8 4q-1 8 1 16M13 7h7v9h-7zM16.5 7v9M13 11.5h7" />
  </svg>
)

/** The More menu's glyphs, live toys only (the others export their glyph for their own use). */
export const TOY_ICONS: Record<LiveId, () => JSX.Element> = {
  charge: IconCharge,
  void: IconVoid,
  smash: IconSmash,
  pop: IconPop,
  knock: IconKnock,
  purr: IconPurr,
  squish: IconSquish,
  scratch: IconScratch,
  peel: IconPeel,
  twirl: IconTwirl,
  yoink: IconYoink,
  silk: IconSilk,
}
