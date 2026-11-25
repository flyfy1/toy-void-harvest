// The share sheet (loaded on demand). The card on top, large; at most three actions below, by context:
// a phone that can share files, WeChat and other in-app browsers (no navigator.share: the card is a real
// <img> to press and hold), or a desktop (copy image, copy link, download).
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { locale, type ToyId } from '../i18n'
import { emit, store, trackShare, type Card, type Method, type ShareMethod } from '../share'
import { track } from '../analytics'
import { S, fileName, primaryLabel, shareExtra, shareText, shareUrl } from '../cards'
import { IconClose } from './Icons'

function closeSheet() {
  store.sheet = null
  emit()
}


type Mode = 'phone' | 'inapp' | 'desktop'
const mode = (): Mode => (matchMedia('(pointer: coarse)').matches ? (typeof navigator.share === 'function' ? 'phone' : 'inapp') : 'desktop')

async function copyText(line: string) {
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
}

const NET: { id: 'weibo' | 'x' | 'whatsapp'; label: string; href: (u: string, s: string) => string }[] = [
  { id: 'weibo', label: '微博', href: (u, s) => `https://service.weibo.com/share/share.php?url=${encodeURIComponent(u)}&title=${encodeURIComponent(s)}` },
  { id: 'x', label: 'X', href: (u, s) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(s)}&url=${encodeURIComponent(u)}` },
  { id: 'whatsapp', label: 'WhatsApp', href: (u, s) => `https://wa.me/?text=${encodeURIComponent(`${s} ${u}`)}` },
]

export default function ShareSheet({ toy }: { toy: ToyId }) {
  const from = store.sheet ?? 'button'
  const [m] = useState(mode)
  const [card, setCard] = useState<Card | null>(store.peak ? store.card : null)
  const [jpeg, setJpeg] = useState('')
  const [full, setFull] = useState(false)
  const [copied, setCopied] = useState(false)
  const held = useRef<{ timer: number; sent: boolean }>({ timer: 0, sent: false })

  useEffect(() => {
    track('share_open', { from, card: store.peak ? 1 : 0 })
    // no peak yet (or nothing drawn): draw the toy's default document with today's numbers
    // (card.ts stays a chunk of its own: imported on demand here and at a peak)
    if (!store.peak || !store.card) import('../card').then((c) => c.renderCard(toy)).then(setCard, () => {})
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeSheet()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    // WeChat: a JPEG data URL (reports differ on whether blob: images can be saved there)
    if (card && m === 'inapp') setJpeg(card.canvas.toDataURL('image/jpeg', 0.9))
  }, [card, m])

  const text = () => shareText(toy)
  const url = (r: Method) => shareUrl(toy, r)
  const file = () => (card ? new File([card.blob], fileName(toy), { type: 'image/png' }) : null)
  const canFiles = (() => {
    const f = file()
    return !!(f && navigator.canShare?.({ files: [f] }))
  })()
  const done = (method: ShareMethod) => trackShare('done', method, from, shareExtra(toy))
  const flash = () => {
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2400)
  }

  const sendFile = async () => {
    const f = file()
    if (!f) return
    trackShare('method', 'file', from)
    try {
      await navigator.share({ files: [f], text: `${text()} ${url('f')}` })
      done('file')
    } catch {
      /* cancelled */
    }
  }
  const sendLink = async () => {
    trackShare('method', 'link', from)
    try {
      await navigator.share({ title: document.title, text: text(), url: url('l') })
      done('link')
    } catch {
      /* cancelled */
    }
  }
  const save = () => {
    if (!card) return
    trackShare('method', 'save', from)
    const a = document.createElement('a')
    a.href = card.url
    a.download = fileName(toy)
    document.body.append(a)
    a.click()
    a.remove()
    done('save')
  }
  const copyLink = async () => {
    trackShare('method', 'copy_link', from)
    await copyText(`${text()} ${url('c')}`)
    flash()
    done('copy_link')
  }
  const copyImage = async () => {
    if (!card) return
    trackShare('method', 'copy_image', from)
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': card.blob })])
      flash()
      done('copy_image')
    } catch {
      /* not allowed here: Download still works */
    }
  }
  // in-app browsers: a press of 500 ms or longer on the picture is the only sign of a share we get
  const holdStart = () => {
    window.clearTimeout(held.current.timer)
    held.current.timer = window.setTimeout(() => {
      if (held.current.sent) return
      held.current.sent = true
      trackShare('method', 'longpress', from)
    }, 500)
  }
  const holdEnd = () => window.clearTimeout(held.current.timer)

  const btn = 'flex min-h-[48px] w-full items-center justify-center rounded-2xl px-4 text-[15px] font-semibold active:scale-[0.98] disabled:opacity-40'
  const primary = `${btn} bg-white text-black`
  const secondary = `${btn} bg-white/12 text-white`
  const nets = locale === 'zh-CN' ? NET.filter((n) => n.id === 'weibo') : NET.filter((n) => n.id !== 'weibo')

  const picture =
    m === 'inapp' ? (
      jpeg ? (
        <img
          src={jpeg}
          alt={S.heading}
          onClick={() => setFull(true)}
          onPointerDown={holdStart}
          onPointerUp={holdEnd}
          onPointerCancel={holdEnd}
          onContextMenu={() => holdEnd()}
          className="mx-auto max-h-[58vh] w-auto max-w-full rounded-xl shadow-2xl"
          style={{ WebkitTouchCallout: 'default', userSelect: 'auto' } as CSSProperties}
        />
      ) : (
        <div className="mx-auto aspect-[4/5] h-[46vh] max-w-full animate-pulse rounded-xl bg-white/10" />
      )
    ) : card ? (
      <img src={card.url} alt={S.heading} className="mx-auto max-h-[52vh] w-auto max-w-full rounded-xl shadow-2xl" />
    ) : (
      <div className="mx-auto aspect-[4/5] h-[46vh] max-w-full animate-pulse rounded-xl bg-white/10" />
    )

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 sm:items-center"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={closeSheet}
    >
      <div
        role="dialog"
        aria-label={S.heading}
        className="w-full max-w-sm rounded-3xl border border-white/12 bg-[#17130f]/95 p-4 text-white shadow-2xl backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="pl-1 text-base font-semibold">{S.heading}</h2>
          <button type="button" onClick={closeSheet} aria-label={S.close} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
            <IconClose />
          </button>
        </div>
        {picture}
        <div className="mt-4 flex flex-col gap-2">
          {m === 'phone' && (
            <>
              <button type="button" className={primary} disabled={!card} onClick={canFiles ? sendFile : sendLink}>
                {primaryLabel(toy)}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className={secondary} onClick={sendLink}>
                  {S.link}
                </button>
                <button type="button" className={secondary} disabled={!card} onClick={save}>
                  {S.save}
                </button>
              </div>
            </>
          )}
          {m === 'inapp' && (
            <>
              <p className="text-center text-[15px] font-medium text-white/90">{S.hold}</p>
              <p className="-mt-1 text-center text-xs text-white/55">{S.shot}</p>
              <button type="button" className={secondary} onClick={copyLink}>
                {copied ? S.copied : S.copy_link}
              </button>
            </>
          )}
          {m === 'desktop' && (
            <>
              {typeof ClipboardItem !== 'undefined' && (
                <button type="button" className={primary} disabled={!card} onClick={copyImage}>
                  {S.copy_image}
                </button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className={secondary} onClick={copyLink}>
                  {S.copy_link}
                </button>
                <button type="button" className={secondary} disabled={!card} onClick={save}>
                  {S.download}
                </button>
              </div>
              {copied && <p className="text-center text-xs text-emerald-300">{S.copied}</p>}
              <div className="mt-1 flex justify-center gap-4 text-xs text-white/55">
                {nets.map((n) => (
                  <a
                    key={n.id}
                    href={n.href(url('d'), text())}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackShare('method', n.id, from)}
                    className="underline-offset-4 hover:text-white hover:underline"
                  >
                    {n.label}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {full && jpeg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black" onClick={(e) => (e.stopPropagation(), setFull(false))}>
          <img
            src={jpeg}
            alt={S.heading}
            onPointerDown={holdStart}
            onPointerUp={holdEnd}
            onPointerCancel={holdEnd}
            className="max-h-full max-w-full object-contain"
            style={{ WebkitTouchCallout: 'default', userSelect: 'auto' } as CSSProperties}
          />
        </div>
      )}
    </div>,
    document.body,
  )
}
