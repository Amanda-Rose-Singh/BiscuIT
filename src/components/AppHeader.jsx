import { formatWalletBalance } from '../utils/money.js'
import { useAppStore } from '../store/useAppStore.js'

const NAV = [
  { id: 'races', label: 'Races', testId: 'nav-races' },
  { id: 'history', label: 'Bet History', testId: 'nav-history' },
  { id: 'wallet', label: 'Wallet', testId: 'nav-wallet' },
]

export function AppHeader() {
  const view = useAppStore((state) => state.view)
  const setView = useAppStore((state) => state.setView)
  const walletBalance = useAppStore((state) => state.walletBalance)

  return (
    <header className="app-header" data-testid="app-header">
      <div className="brand">
        <strong>BiscuIT</strong>
        <span>Simulated sportsbook</span>
      </div>
      <nav className="app-nav" data-testid="app-nav">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            data-testid={item.testId}
            className={
              view === item.id || (item.id === 'races' && view === 'race-detail')
                ? 'is-active'
                : ''
            }
            onClick={() => setView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="header-wallet">
        <span>Balance</span>
        <span data-testid="wallet-balance">{formatWalletBalance(walletBalance)}</span>
      </div>
    </header>
  )
}
