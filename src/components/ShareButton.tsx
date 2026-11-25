import { lazy, Suspense, useSyncExternalStore } from 'react'
import { t, type ToyId } from '../i18n'
import { openSheet, store, subscribe } from '../share'
import { pillClass } from './MoreMenu'
import { IconShare } from './Icons'

/** The sheet, the card generator and the QR encoder load on the first peak or the first tap. */
const ShareSheet = lazy(() => import('./ShareSheet'))
/** The slip only appears once a card is drawn, so it loads with it. */
const Slip = lazy(() => import('./Slip'))
const version = () => store.version

/** The Share pill (with a dot when a card is waiting), the slip above it, and the sheet when open. */
export function ShareButton({ toy }: { toy: ToyId }) {
  useSyncExternalStore(subscribe, version, version)
  return (
    <>
      <button type="button" onClick={() => openSheet('button')} className={`${pillClass(toy)} relative`}>
        <IconShare />
        {t('share')}
        {store.dot && <span aria-hidden className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white/80 bg-[#E5484D]" />}
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
