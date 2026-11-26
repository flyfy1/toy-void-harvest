import { useEffect, useState } from 'react'

/**
 * The landing tag: a small paper label near the top that says somebody sent this. In the toy's own
 * material (pass the paper's classes); it never takes a touch and goes away on the first one.
 */
export function Tag({ text, className = '', paper = 'bg-[#FFF8EA] text-[#3A2A1C]', ms = 9000 }: { text: string; className?: string; paper?: string; ms?: number }) {
  const [on, setOn] = useState(true)
  useEffect(() => {
    const off = () => setOn(false)
    window.addEventListener('pointerdown', off, { once: true, capture: true })
    const tm = window.setTimeout(off, ms)
    return () => {
      window.removeEventListener('pointerdown', off, true)
      window.clearTimeout(tm)
    }
  }, [])
  return (
    <div className={`pointer-events-none fixed inset-x-0 z-10 flex justify-center px-6 transition-opacity duration-700 ${on ? 'opacity-100' : 'opacity-0'} ${className}`}>
      <div className={`relative max-w-[22rem] -rotate-2 rounded-md py-2 pl-8 pr-4 text-[14px] leading-snug shadow-[0_6px_18px_rgba(0,0,0,.35)] ${paper}`}>
        <span aria-hidden className="absolute left-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-current opacity-50" />
        {text}
      </div>
    </div>
  )
}
