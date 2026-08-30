import { formatOdds, formatPayout, formatWalletBalance } from '../utils/money.js'
import { useAppStore } from '../store/useAppStore.js'

export function Betslip() {
  const legs = useAppStore((state) => state.legs)
  const races = useAppStore((state) => state.races)
  const payoutTotal = useAppStore((state) => state.payoutTotal)
  const placing = useAppStore((state) => state.placing)
  const errorMessage = useAppStore((state) => state.errorMessage)
  const infoMessage = useAppStore((state) => state.infoMessage)
  const oddsConfirmPending = useAppStore((state) => state.oddsConfirmPending)
  const setStake = useAppStore((state) => state.setStake)
  const removeLeg = useAppStore((state) => state.removeLeg)
  const clearSlip = useAppStore((state) => state.clearSlip)
  const placeBets = useAppStore((state) => state.placeBets)

  const totalStake = legs.reduce((sum, leg) => sum + (Number(leg.stake) || 0), 0)

  return (
    <aside className="betslip-panel" data-testid="betslip-panel">
      <div className="betslip-header">
        <h2>Betslip</h2>
        <button
          type="button"
          data-testid="betslip-clear-button"
          onClick={clearSlip}
          disabled={!legs.length}
        >
          Clear
        </button>
      </div>

      {!legs.length && (
        <p className="empty-copy" data-testid="betslip-empty">
          Click a runner&apos;s odds to add a selection.
        </p>
      )}

      <ul className="betslip-legs">
        {legs.map((leg, index) => {
          const race = races.find((item) => item.id === leg.raceId)
          const liveOdds = race?.runners.find((item) => item.id === leg.runnerId)?.odds
          const locked = race && race.status !== 'upcoming'
          return (
            <li
              key={`${leg.raceId}-${leg.runnerId}`}
              className="betslip-leg"
              data-testid={`betslip-leg-${index}`}
            >
              <div className="betslip-leg-meta">
                <strong>{leg.runnerName}</strong>
                <span>{leg.raceName}</span>
                <span>
                  Odds {formatOdds(leg.oddsAtAdd)}
                  {liveOdds != null && liveOdds !== leg.oddsAtAdd
                    ? ` · now ${formatOdds(liveOdds)}`
                    : ''}
                </span>
                {locked && (
                  <span className="warn-inline" data-testid={`betslip-leg-locked-${index}`}>
                    Race locked
                  </span>
                )}
              </div>
              <label className="stake-label">
                Stake
                <input
                  data-testid={`betslip-stake-input-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={leg.stake}
                  onChange={(event) => setStake(index, event.target.value)}
                />
              </label>
              <button
                type="button"
                data-testid={`betslip-remove-leg-${index}`}
                onClick={() => removeLeg(index)}
              >
                Remove
              </button>
            </li>
          )
        })}
      </ul>

      <div className="betslip-totals">
        <div>
          <span>Total stake</span>
          <strong data-testid="betslip-total-stake">{formatWalletBalance(totalStake)}</strong>
        </div>
        <div>
          <span>Potential payout</span>
          <strong data-testid="betslip-total-payout">{payoutTotal}</strong>
        </div>
      </div>

      {oddsConfirmPending && (
        <p className="warn-copy" data-testid="betslip-odds-changed-warning">
          Odds have moved since you added one or more selections. Review the new
          prices and press Place Bet again to accept them.
        </p>
      )}

      {errorMessage && (
        <p className="error-copy" data-testid="betslip-error">
          {errorMessage}
        </p>
      )}
      {infoMessage && (
        <p className="info-copy" data-testid="betslip-info">
          {infoMessage}
        </p>
      )}

      <button
        type="button"
        className="place-bet"
        data-testid="betslip-place-bet-button"
        onClick={placeBets}
      >
        {placing
          ? 'Placing…'
          : oddsConfirmPending
            ? 'Accept odds & place bet'
            : 'Place Bet'}
      </button>
    </aside>
  )
}
