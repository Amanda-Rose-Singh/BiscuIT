import { useState } from 'react'
import { Countdown } from '../components/Countdown.jsx'
import { RunnerTableHead } from '../components/RunnerTableHead.jsx'
import { RunnerRow } from '../components/RunnerRow.jsx'
import { raceDistance, raceRegion, formatPostClock } from '../utils/display.js'
import { useAppStore } from '../store/useAppStore.js'

const TABS = [
  { id: 'live', label: 'Live Now' },
  { id: 'next', label: 'Next 10 Races' },
  { id: 'meetings', label: "Today's Meetings" },
]

function matchesTab(race, tab) {
  if (tab === 'live') {
    return race.status === 'in-progress' || race.status === 'closed'
  }
  if (tab === 'next') {
    return race.status === 'upcoming'
  }
  return true
}

export function RacesView({ region }) {
  const races = useAppStore((state) => state.races)
  const loading = useAppStore((state) => state.loading)
  const openRace = useAppStore((state) => state.openRace)
  const [tab, setTab] = useState('meetings')

  if (loading && !races.length) {
    return (
      <p data-testid="races-loading" className="empty-copy">
        Loading races…
      </p>
    )
  }

  const filtered = races.filter((race) => {
    if (region && raceRegion(race) !== region) {
      return false
    }
    if (tab === 'meetings') {
      return true
    }
    return matchesTab(race, tab)
  })

  const listed = tab === 'next' ? filtered.slice(0, 10) : filtered

  return (
    <section>
      <div className="center-tabs" data-testid="meeting-tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            data-testid={`tab-${item.id}`}
            className={tab === item.id ? 'is-active' : ''}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ul className="race-list" data-testid="races-list">
        {!listed.length && (
          <li className="empty-copy" data-testid="races-empty">
            No meetings in this filter.
          </li>
        )}
        {listed.map((race) => (
          <li key={race.id} className="meeting-card">
            <div className="meeting-head">
              <button
                type="button"
                className="race-card"
                data-testid={`race-card-${race.id}`}
                onClick={() => openRace(race.id)}
              >
                <div className="race-title-block">
                  <strong>
                    {race.name}{' '}
                    <span className="region-badge">{raceRegion(race)}</span>
                  </strong>
                  <span className="race-venue">{race.trackName}</span>
                </div>
                <div className="race-card-meta">
                  <span>
                    Post {formatPostClock(race.postTime)} · {raceDistance(race)}m
                  </span>
                  <span data-testid={`race-status-${race.id}`}>{race.status}</span>
                  <Countdown
                    raceId={race.id}
                    postTime={race.postTime}
                    status={race.status}
                  />
                </div>
              </button>
            </div>
            <div className="runner-table-wrap">
              <RunnerTableHead />
              <RunnerRow race={race} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
