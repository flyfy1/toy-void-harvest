import { useEffect, useState } from 'react'
import { t, type ToyId } from '../i18n'
import { NETWORKS, shareText, shareUrl, stats } from '../share'
import { track } from '../analytics'
import { pillClass } from './MoreMenu'

const isTouch = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

/** The QR encoder is loaded on demand: only the desktop share dialog needs it. */
async function qrDataUrl(text: string): Promise<string> {
  const { default: qrcode } = await import('qrcode-generator')
  const qr = qrcode(0, 'M')
  qr.addData(text, 'Byte')
  qr.make()
  return qr.createDataURL(6, 2)
}

/** knock: the lifetime count rides along on the share event (a number, never user text). */
const shareExtra = (toy: ToyId): Record<string, number> => (toy === 'knock' && stats.n ? { total: stats.n } : {})

export function ShareButton({ toy }: { toy: ToyId }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [payload, setPayload] = useState({ url: '', text: '', qr: '' })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const start = async () => {
    const url = shareUrl(toy)
    const text = shareText(toy)
    // Phones: the system share sheet already lists WeChat, WhatsApp, Messages…
    if (isTouch() && navigator.share) {
      try {
        await navigator.share({ title: document.title, text, url })
        track('share', { method: 'native', ...shareExtra(toy) })
        return
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return
      }
    }
    setPayload({ url, text, qr: await qrDataUrl(url) })
    setCopied(false)
    setOpen(true)
  }

  const copy = async () => {
    const line = `${payload.text} ${payload.url}`
    try {
      await navigator.clipboard.writeText(line)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = line
      document.body.append(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    track('share', { method: 'copy', ...shareExtra(toy) })
  }

  return (
    <>
      <button type="button" onClick={start} className={pillClass(toy)}>
        ↗ {t('share')}
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label={t('share_heading')}
            className={`w-full max-w-sm rounded-3xl border border-white/15 ${toy === 'knock' ? 'bg-[#1f140d]' : toy === 'purr' ? 'bg-[#2a1f17]' : 'bg-[#0d0d1a]'} p-5 text-white shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">{t('share_heading')}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20">
                ✕
              </button>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-white/75">{payload.text}</p>
            <div className="mb-3 flex gap-2">
              <input readOnly value={payload.url} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 text-base text-white/80 outline-none" />
              <button type="button" onClick={copy} className="shrink-0 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black active:scale-95">
                {copied ? '✓' : t('copy_link')}
              </button>
            </div>
            {copied && <p className="-mt-1 mb-2 text-xs text-emerald-300">{t('copied')}</p>}
            <div className="mb-4 grid grid-cols-4 gap-2">
              {NETWORKS.map((n) => (
                <a
                  key={n.id}
                  href={n.href(payload.url, payload.text)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('share', { method: n.id, ...shareExtra(toy) })}
                  className="rounded-xl bg-white/10 px-1 py-2 text-center text-xs text-white/85 hover:bg-white/20"
                >
                  {n.label}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white p-2">
              <img src={payload.qr} alt="QR code" width={96} height={96} className="h-24 w-24 [image-rendering:pixelated]" />
              <p className="text-xs leading-snug text-black/70">{t('scan')}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
