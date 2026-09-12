import { useEffect, useState } from 'react'
import { getDebugSettings, setDebugSettings } from '../api/mockApi.js'

export function DebugPanel() {
  const [delayMs, setDelayMs] = useState(0)
  const [forceError, setForceError] = useState(false)

  useEffect(() => {
    const load = () => {
      getDebugSettings().then((result) => {
        if (result.ok) {
          setDelayMs(result.data.delayMs)
          setForceError(result.data.forceNextBetError)
        }
      })
    }
    load()
    const timer = setInterval(load, 1500)
    return () => clearInterval(timer)
  }, [])

  return (
    <aside className="debug-panel" data-testid="debug-panel">
      <strong>Debug</strong>
      <label>
        API delay (ms)
        <input
          data-testid="debug-delay-input"
          type="range"
          min="0"
          max="3000"
          step="100"
          value={delayMs}
          onChange={async (event) => {
            const next = Number(event.target.value)
            setDelayMs(next)
            await setDebugSettings({ delayMs: next })
          }}
        />
        <span>{delayMs}</span>
      </label>
      <label>
        <input
          data-testid="debug-force-error-toggle"
          type="checkbox"
          checked={forceError}
          onChange={async (event) => {
            const next = event.target.checked
            setForceError(next)
            const result = await setDebugSettings({ forceNextBetError: next })
            if (result.ok) {
              setForceError(result.data.forceNextBetError)
            }
          }}
        />
        Force next bet 500
      </label>
    </aside>
  )
}
