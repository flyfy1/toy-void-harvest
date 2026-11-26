import { lazy, Suspense, useEffect, useState } from 'react'
import { t, type ToyId } from '../i18n'
import { ShareButton } from './ShareButton'
import { IconClose, IconGrid } from './Icons'

/** The open menu (every live toy's name and glyph) is its own small chunk, fetched ahead when the page is
 *  idle. If it cannot load (offline, or a deploy since the page opened) the menu just closes; the toy keeps going. */
let close = () => {}
const loadPanel = () => import('./MorePanel')
const MorePanel = lazy(() => loadPanel().catch(() => (close(), { default: (() => null) as unknown as typeof import('./MorePanel').default })))

/** Light toys (pale backgrounds) get dark-ink pills. */
export const LIGHT_TOYS: ToyId[] = ['purr', 'pop', 'squish', 'peel', 'crunch', 'twirl', 'yoink', 'silk']
export const pillClass = (toy: ToyId) =>
  LIGHT_TOYS.includes(toy)
    ? 'inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#4A3A2C]/12 bg-[#FFF9F0]/78 px-[14px] text-sm font-medium leading-none text-[#4A3A2C]/90 shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_4px_14px_rgba(74,58,44,.12)] backdrop-blur-md hover:bg-[#FFF9F0]/90 active:scale-95'
    : 'inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-white/10 px-[14px] text-sm font-medium leading-none text-white/80 backdrop-blur-md hover:bg-white/20 active:scale-95'

export function MoreMenu({ current }: { current: ToyId }) {
  const [open, setOpen] = useState(false)
  close = () => setOpen(false)
  useEffect(() => {
    const go = () => void loadPanel().catch(() => {})
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 4000 })
    else setTimeout(go, 2500)
  }, [])
  return (
    <div className="fixed bottom-3 right-3 z-20 flex flex-col items-end gap-2 select-none" onPointerDown={(e) => e.stopPropagation()}>
      {open && (
        <Suspense fallback={null}>
          <MorePanel current={current} onClose={() => setOpen(false)} />
        </Suspense>
      )}
      <div className="flex gap-2">
      <ShareButton toy={current} />
      <button onClick={() => setOpen((o) => !o)} className={pillClass(current)} aria-label={open ? 'Close' : t('more')}>
        {open ? <IconClose /> : <><IconGrid />{t('more')}</>}
      </button>
      </div>
    </div>
  )
}
