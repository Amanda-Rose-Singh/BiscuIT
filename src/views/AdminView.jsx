import { useState } from 'react'
import { useAppStore } from '../store/useAppStore.js'

export function AdminView() {
  const races = useAppStore((state) => state.races)
  const settleAdmin = useAppStore((state) => state.settleAdmin)
  const [outcomes, setOutcomes] = useState({})
  const [message, setMessage] = useState('')

  return (
    <section className="panel-card" data-testid="admin-settle-panel">
      <h1>Admin — Simulate Result</h1>
      <p className="muted">
        Applies the same outcome to every pending bet on that market. Already
        settled markets are rejected.
      </p>
      {message && <p className="info-copy">{message}</p>}
      <ul className="admin-list">
        {races.map((race) => (
          <li key={race.id} className="admin-row">
            <div>
              <strong>{race.name}</strong>
              <span className="muted">
                {race.id} · {race.status}
              </span>
            </div>
            <select
              data-testid={`admin-settle-outcome-select-${race.id}`}
              value={outcomes[race.id] || 'won'}
              onChange={(event) =>
                setOutcomes((current) => ({
                  ...current,
                  [race.id]: event.target.value,
                }))
              }
            >
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="push">Push</option>
            </select>
            <button
              type="button"
              data-testid={`admin-settle-submit-${race.id}`}
              onClick={async () => {
                const result = await settleAdmin(
                  race.id,
                  outcomes[race.id] || 'won',
                )
                setMessage(
                  result.ok
                    ? `Settled ${race.name} (${result.data.outcome}).`
                    : result.error,
                )
              }}
            >
              Settle
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
