import { formatOdds, formatPayout, formatWalletBalance } from '../utils/money.js'
import { placeOdds } from '../utils/display.js'
import { useAppStore } from '../store/useAppStore.js'

const QUICK_STAKES = [10, 50, 100]

export function Betslip({ mobileOpen, onClose }) {
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

  const addQuickStake = (index, amount) => {
    const current = Number(legs[index]?.stake) || 0
    setStake(index, String(current + amount))
  }

  return (
    <aside
      className={mobileOpen ? 'betslip-panel is-open' : 'betslip-panel'}
      data-testid="betslip-panel"
    >
      <div className="betslip-header">
        <h2>Bet slip</h2>
        <div className="betslip-header-actions">
          <button
            type="button"
            data-testid="betslip-clear-button"
            onClick={clearSlip}
            disabled={!legs.length}
          >
            Clear
          </button>
          <button
            type="button"
            className="icon-button mobile-only"
            data-testid="betslip-close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      {!legs.length && (
        <p className="empty-copy" data-testid="betslip-empty">
          Click a runner&apos;s odds to add a selection.
        </p>
      )}

      <ul className="betslip-legs">
        {legs.map((leg, index) => {
          const race = races.find((item) => item.id === leg.raceId)
          const winOdds = race?.runners.find((item) => item.id === leg.runnerId)?.odds
          const liveOdds =
            winOdds == null
              ? undefined
              : leg.market === 'place'
                ? placeOdds(winOdds)
                : winOdds
          const locked = race && race.status !== 'upcoming'
          const stake = Number(leg.stake) || 0
          const linePayout = stake * (liveOdds ?? leg.oddsAtAdd)
          return (
            <li
              key={`${leg.raceId}-${leg.runnerId}-${leg.market || 'win'}`}
              className="betslip-leg"
              data-testid={`betslip-leg-${index}`}
            >
              <div className="betslip-leg-meta">
                <strong>
                  {leg.runnerName}{' '}
                  <span className="market-chip">{leg.market === 'place' ? 'Place' : 'Win'}</span>
                </strong>
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
              <div className="quick-stakes">
                {QUICK_STAKES.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    data-testid={`betslip-quick-stake-${index}-${amount}`}
                    onClick={() => addQuickStake(index, amount)}
                  >
                    +{amount}
                  </button>
                ))}
              </div>
              <p className="leg-payout">
                Returns {formatPayout(linePayout)}
              </p>
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
