import { Countdown } from '../components/Countdown.jsx'
import { RunnerTableHead } from '../components/RunnerTableHead.jsx'
import { RunnerRow } from '../components/RunnerRow.jsx'
import { formatPostClock, raceDistance, raceRegion } from '../utils/display.js'
import { useAppStore } from '../store/useAppStore.js'

export function RaceDetailView() {
  const selectedRaceId = useAppStore((state) => state.selectedRaceId)
  const races = useAppStore((state) => state.races)
  const setView = useAppStore((state) => state.setView)
  const race = races.find((item) => item.id === selectedRaceId)

  if (!race) {
    return (
      <p className="empty-copy" data-testid="race-detail-missing">
        Race not found.{' '}
        <button type="button" data-testid="back-to-races" onClick={() => setView('races')}>
          Back to races
        </button>
      </p>
    )
  }

  return (
    <section className="meeting-card" data-testid={`race-detail-${race.id}`}>
      <button
        type="button"
        className="text-button"
        data-testid="back-to-races"
        onClick={() => setView('races')}
      >
        ← Meetings
      </button>
      <header className="detail-head">
        <div className="race-title-block">
          <h1>
            {race.name} <span className="region-badge">{raceRegion(race)}</span>
          </h1>
          <p className="race-venue">
            {race.trackName} · {raceDistance(race)}m · Post {formatPostClock(race.postTime)}
          </p>
        </div>
        <p className="race-detail-status">
          Status <span data-testid={`race-status-${race.id}`}>{race.status}</span>
          {' · '}
          <Countdown raceId={race.id} postTime={race.postTime} status={race.status} />
          {race.status !== 'upcoming' && <span className="muted"> · Betting closed</span>}
        </p>
      </header>
      <div className="runner-table-wrap">
        <RunnerTableHead />
        <RunnerRow race={race} />
      </div>
    </section>
  )
}
