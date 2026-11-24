import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { openAbout } from './i18n'

document.getElementById('about-close')?.addEventListener('click', () => openAbout(false))
window.addEventListener('keydown', (e) => e.key === 'Escape' && openAbout(false))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
