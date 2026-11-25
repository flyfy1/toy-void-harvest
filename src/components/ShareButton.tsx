import { lazy, Suspense, useSyncExternalStore } from 'react'
import { t, type ToyId } from '../i18n'
import { emit, openSheet, store, subscribe } from '../share'
import { pillClass } from './MoreMenu'
import { IconShare } from './Icons'

/** A chunk that fails to load (offline, or a deploy since the page opened) closes quietly; the toy keeps going. */
const later = <T,>(p: Promise<{ default: T }>) =>
  p.catch(() => {
    store.sheet = null
    store.slip = 0
    emit()
    return { default: (() => null) as T }
  })
/** The sheet, the card generator and the QR encoder load on the first peak or the first tap. */
const ShareSheet = lazy(() => later(import('./ShareSheet')))
/** The slip only appears once a card is drawn, so it loads with it. */
const Slip = lazy(() => later(import('./Slip')))
const version = () => store.version

/** The Share pill (with a dot when a card is waiting), the slip above it, and the sheet when open. */
export function ShareButton({ toy }: { toy: ToyId }) {
  useSyncExternalStore(subscribe, version, version)
  return (
    <>
      <button type="button" onClick={() => openSheet('button')} className={`${pillClass(toy)} relative`}>
        <IconShare />
        {t('share')}
        {store.dot && <span aria-hidden className="absolute right-1 top-1 size-2.5 rounded-full bg-[#E5484D] ring-2 ring-white/80" />}
      </button>
      {store.slip > 0 && store.card && (
        <Suspense fallback={null}>
          <Slip key={store.slip} toy={toy} src={store.card.url} />
        </Suspense>
      )}
      {store.sheet && (
        <Suspense fallback={null}>
          <ShareSheet toy={toy} />
        </Suspense>
      )}
    </>
  )
}
