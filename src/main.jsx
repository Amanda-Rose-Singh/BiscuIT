import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { startOddsEngine, stopOddsEngine } from './engine/oddsEngine.js'

startOddsEngine()

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopOddsEngine()
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
