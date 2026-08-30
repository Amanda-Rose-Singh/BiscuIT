import { formatOdds } from '../utils/money.js'
import { useAppStore } from '../store/useAppStore.js'

export function RunnerRow({ race }) {
  const addLeg = useAppStore((state) => state.addLeg)
  const open = race.status === 'upcoming'

  return (
    <ul className="runner-list" data-testid={`runner-list-${race.id}`}>
      {race.runners.map((runner) => (
        <li
          key={runner.id}
          className="runner-row"
          data-testid={`runner-row-${race.id}-${runner.id}`}
        >
          <span
            className="silk"
            data-testid={`silk-${race.id}-${runner.id}`}
            style={{ backgroundColor: runner.silkColor }}
          />
          <span className="runner-name">{runner.name}</span>
          {race.winnerId === runner.id && (
            <span className="winner-tag" data-testid={`winner-${race.id}-${runner.id}`}>
              Winner
            </span>
          )}
          <button
            type="button"
            className="odds-button"
            data-testid={`odds-value-${race.id}-${runner.id}`}
            disabled={!open}
            onClick={() => addLeg(race.id, runner.id)}
          >
            {formatOdds(runner.odds)}
          </button>
        </li>
      ))}
    </ul>
  )
}
