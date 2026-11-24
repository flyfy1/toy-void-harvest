/** One-line ghost hint that fades after the first interaction. */
export function Hint({ text, hidden }: { text: string; hidden: boolean }) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-16 z-10 text-center text-sm tracking-widest text-white/60 transition-opacity duration-700 ${hidden ? 'opacity-0' : 'animate-pulse opacity-100'}`}
    >
      {text}
    </div>
  )
}
