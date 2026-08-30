import { formatOdds, formatPayout } from '../utils/money.js'
import { useAppStore } from '../store/useAppStore.js'

export function BetHistoryView() {
  const bets = useAppStore((state) => state.bets)
  const loading = useAppStore((state) => state.loading)

  if (loading && !bets.length) {
    return (
      <p data-testid="history-loading" className="empty-copy">
        Loading bet history…
      </p>
    )
  }

  return (
    <section>
      <h1>Bet history</h1>
      <ul className="history-list" data-testid="bet-history-list">
        {!bets.length && (
          <li className="empty-copy" data-testid="bet-history-empty">
            No bets placed yet.
          </li>
        )}
        {bets.map((bet) => (
          <li
            key={bet.id}
            className="history-row"
            data-testid={`bet-history-row-${bet.id}`}
          >
            <div>
              <strong>{bet.runnerName}</strong>
              <span className="muted">{bet.raceName}</span>
            </div>
            <div className="history-meta">
              <span>Stake {bet.stake}</span>
              <span>Odds {formatOdds(bet.odds)}</span>
              <span>To return {formatPayout(bet.potentialPayout)}</span>
              {bet.settledPayout != null && bet.status !== 'pending' && (
                <span>Settled {formatPayout(bet.settledPayout)}</span>
              )}
              <span data-testid={`bet-history-status-${bet.id}`}>{bet.status}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
