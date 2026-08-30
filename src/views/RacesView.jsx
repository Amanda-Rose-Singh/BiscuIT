import { Countdown } from '../components/Countdown.jsx'
import { useAppStore } from '../store/useAppStore.js'

export function RacesView() {
  const races = useAppStore((state) => state.races)
  const loading = useAppStore((state) => state.loading)
  const openRace = useAppStore((state) => state.openRace)

  if (loading && !races.length) {
    return (
      <p data-testid="races-loading" className="empty-copy">
        Loading races…
      </p>
    )
  }

  return (
    <section>
      <h1>Today&apos;s card</h1>
      <ul className="race-list" data-testid="races-list">
        {races.map((race) => (
          <li key={race.id}>
            <button
              type="button"
              className="race-card"
              data-testid={`race-card-${race.id}`}
              onClick={() => openRace(race.id)}
            >
              <div>
                <strong>{race.name}</strong>
                <span className="muted">{race.trackName}</span>
              </div>
              <div className="race-card-meta">
                <span data-testid={`race-status-${race.id}`}>{race.status}</span>
                <Countdown
                  raceId={race.id}
                  postTime={race.postTime}
                  status={race.status}
                />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
