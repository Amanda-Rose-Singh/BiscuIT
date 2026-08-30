import { formatOdds } from '../utils/money.js'
import {
  openingOdds,
  placeOdds,
  previousOdds,
  runnerDraw,
  runnerForm,
  runnerJockey,
  runnerNumber,
  runnerWas,
} from '../utils/display.js'
import { useAppStore } from '../store/useAppStore.js'

export function RunnerRow({ race }) {
  const addLeg = useAppStore((state) => state.addLeg)
  const legs = useAppStore((state) => state.legs)
  const open = race.status === 'upcoming'
  const fieldSize = race.runners.length

  return (
    <ul className="runner-list" data-testid={`runner-list-${race.id}`}>
      {race.runners.map((runner, index) => {
        const number = runnerNumber(runner) || index + 1
        const winSelected = legs.some(
          (leg) =>
            leg.raceId === race.id &&
            leg.runnerId === runner.id &&
            (leg.market || 'win') === 'win',
        )
        const placeSelected = legs.some(
          (leg) =>
            leg.raceId === race.id &&
            leg.runnerId === runner.id &&
            leg.market === 'place',
        )
        const win = runner.odds
        const place = placeOdds(win)
        return (
          <li
            key={runner.id}
            className="runner-row"
            data-testid={`runner-row-${race.id}-${runner.id}`}
          >
            <span className="col-num">{number}</span>
            <span className="col-num">{runnerDraw(runner, fieldSize)}</span>
            <span className="runner-identity">
              <span
                className="silk"
                data-testid={`silk-${race.id}-${runner.id}`}
                style={{ backgroundColor: runner.silkColor }}
              />
              <span className="runner-copy">
                <span className="runner-name">{runner.name}</span>
                <span className="jockey-name">{runnerJockey(runner)}</span>
                {race.winnerId === runner.id && (
                  <span
                    className="winner-tag"
                    data-testid={`winner-${race.id}-${runner.id}`}
                  >
                    Winner
                  </span>
                )}
              </span>
            </span>
            <span className="col-num col-was">{runnerWas(runner)}</span>
            <span className="col-num runner-form">{runnerForm(runner)}</span>
            <span className="col-num">{formatOdds(openingOdds(runner))}</span>
            <span className="col-num">{formatOdds(previousOdds(runner))}</span>
            <button
              type="button"
              className={winSelected ? 'odds-button is-selected' : 'odds-button'}
              data-testid={`odds-value-${race.id}-${runner.id}`}
              disabled={!open}
              onClick={() => addLeg(race.id, runner.id, 'win')}
            >
              {formatOdds(win)}
            </button>
            <button
              type="button"
              className={placeSelected ? 'odds-button is-selected' : 'odds-button'}
              data-testid={`odds-place-${race.id}-${runner.id}`}
              disabled={!open}
              onClick={() => addLeg(race.id, runner.id, 'place')}
            >
              {formatOdds(place)}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
