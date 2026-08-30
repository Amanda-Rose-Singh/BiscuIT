import { formatWalletBalance } from '../utils/money.js'
import { useAppStore } from '../store/useAppStore.js'

export function AccountWidget({ onNavigate }) {
  const view = useAppStore((state) => state.view)
  const setView = useAppStore((state) => state.setView)
  const walletBalance = useAppStore((state) => state.walletBalance)

  const openWallet = () => {
    setView('wallet')
    onNavigate?.()
  }

  return (
    <div className="account-widget" data-testid="account-widget">
      <p className="nav-section-label">Account</p>
      <button
        type="button"
        className={view === 'wallet' ? 'wallet-summary is-active' : 'wallet-summary'}
        data-testid="nav-wallet"
        onClick={openWallet}
      >
        <span className="wallet-summary-label">Balance</span>
        <span className="wallet-summary-row">
          <span data-testid="wallet-balance">{formatWalletBalance(walletBalance)}</span>
          <span className="wallet-currency">CR</span>
        </span>
      </button>
      <button
        type="button"
        className="deposit-button"
        data-testid="nav-deposit"
        onClick={openWallet}
      >
        Deposit
      </button>
    </div>
  )
}
