import { useEffect, useRef, useState } from 'react'
import { MoreMenu } from './components/MoreMenu'
import { Hint } from './components/Hint'
import { startGame } from './game'

export default function App() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [touched, setTouched] = useState(false)
  useEffect(() => startGame(ref.current!, () => setTouched(true)), [])
  return (
    <>
      <canvas ref={ref} />
      <Hint text="移动黑洞吸光一切 · 点一下开声音" hidden={touched} />
      <MoreMenu current="void" />
    </>
  )
}
