import { useEffect, useState } from 'react'
import qrcode from 'qrcode-generator'
import { t, type ToyId } from '../i18n'
import { NETWORKS, shareText, shareUrl } from '../share'
import { track } from '../analytics'

const isTouch = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

function qrDataUrl(text: string): string {
  const qr = qrcode(0, 'M')
  qr.addData(text, 'Byte')
  qr.make()
  return qr.createDataURL(6, 2)
}

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
        track('share', { method: 'native' })
        return
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return
      }
    }
    setPayload({ url, text, qr: qrDataUrl(url) })
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
    track('share', { method: 'copy' })
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white/80 backdrop-blur-md hover:bg-white/20 active:scale-95"
      >
        ↗ {t('share')}
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label={t('share_heading')}
            className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#0d0d1a] p-5 text-white shadow-2xl"
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
                  onClick={() => track('share', { method: n.id })}
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
