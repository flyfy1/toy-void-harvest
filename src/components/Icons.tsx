/** Inline line icons for pills and menus: 20 px, 1.75 px stroke, currentColor. No emoji in any button. */

const S = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }

export const IconShare = () => (
  <svg {...S}>
    <path d="M12 15V4m0 0-4 4m4-4 4 4" />
    <path d="M6 12.5v6a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-6" />
  </svg>
)
export const IconGrid = () => (
  <svg {...S}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
  </svg>
)
export const IconClose = () => (
  <svg {...S}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
)
export const IconInfo = () => (
  <svg {...S}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5" />
    <circle cx="12" cy="7.8" r="0.4" fill="currentColor" />
  </svg>
)

// The per-toy glyphs and the More menu's TOY_ICONS are in ToyIcons.tsx.

// ---------- knock pills ----------

/** Knocking by hand: the mallet. */
export const IconMallet = () => (
  <svg {...S}>
    <path d="m12.6 11.4-8.1 8.1" />
    <rect x="11.2" y="3.2" width="6.2" height="9.6" rx="3.1" transform="rotate(45 14.3 8)" />
  </svg>
)
/** Outsourced: two arrows chasing each other. */
export const IconAuto = () => (
  <svg {...S}>
    <path d="M19.4 10.4A7.6 7.6 0 0 0 5.6 8" />
    <path d="M5.3 4.4 5.6 8l3.6-.4" />
    <path d="M4.6 13.6A7.6 7.6 0 0 0 18.4 16" />
    <path d="m18.7 19.6-.3-3.6-3.6.4" />
  </svg>
)
