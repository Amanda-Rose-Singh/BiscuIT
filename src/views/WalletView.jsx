import { formatWalletBalance } from '../utils/money.js'
import { STARTING_BALANCE } from '../data/seed.js'
import { useAppStore } from '../store/useAppStore.js'

export function WalletView() {
  const walletBalance = useAppStore((state) => state.walletBalance)
  const bets = useAppStore((state) => state.bets)

  const pendingStake = bets
    .filter((bet) => bet.status === 'pending')
    .reduce((sum, bet) => sum + bet.stake, 0)
  const won = bets
    .filter((bet) => bet.status === 'won')
    .reduce((sum, bet) => sum + (bet.settledPayout || 0), 0)

  return (
    <section className="panel-card" data-testid="wallet-view">
      <h1>Account</h1>
      <p className="wallet-hero">
        <span>Available credits</span>
        <strong data-testid="wallet-balance-detail">
          {formatWalletBalance(walletBalance)}
        </strong>
      </p>
      <ul className="wallet-facts" data-testid="wallet-facts">
        <li>Starting balance {STARTING_BALANCE}</li>
        <li>Pending stakes {formatWalletBalance(pendingStake)}</li>
        <li>Settled winnings {formatWalletBalance(won)}</li>
      </ul>
      <p className="muted">
        Simulated sportsbook. Deposit is display-only; refresh resets the wallet
        and today&apos;s card.
      </p>
    </section>
  )
}
