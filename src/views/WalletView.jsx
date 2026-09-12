import { useState } from 'react'
import { formatWalletBalance } from '../utils/money.js'
import { STARTING_BALANCE } from '../data/seed.js'
import { useAppStore } from '../store/useAppStore.js'

function MoneyModal({
  testId,
  title,
  inputId,
  confirmId,
  submitLabel,
  onClose,
  onSubmit,
}) {
  const [amount, setAmount] = useState('100')
  const [error, setError] = useState('')

  return (
    <div className="auth-scrim" data-testid={testId}>
      <form
        className="auth-card"
        onSubmit={async (event) => {
          event.preventDefault()
          const result = await onSubmit(amount)
          if (!result.ok) {
            setError(result.error)
            return
          }
          onClose()
        }}
      >
        <h2>{title}</h2>
        <label className="auth-label">
          Amount
          <input
            data-testid={inputId}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        {error && <p className="error-copy">{error}</p>}
        <button type="submit" data-testid={confirmId}>
          {submitLabel}
        </button>
        <button type="button" className="text-button" onClick={onClose}>
          Cancel
        </button>
      </form>
    </div>
  )
}

export function WalletView() {
  const walletBalance = useAppStore((state) => state.walletBalance)
  const bets = useAppStore((state) => state.bets)
  const transactions = useAppStore((state) => state.transactions)
  const deposit = useAppStore((state) => state.deposit)
  const withdraw = useAppStore((state) => state.withdraw)
  const [modal, setModal] = useState(null)

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
      <div className="wallet-actions">
        <button
          type="button"
          data-testid="wallet-deposit-button"
          onClick={() => setModal('deposit')}
        >
          Deposit
        </button>
        <button
          type="button"
          data-testid="wallet-withdraw-button"
          onClick={() => setModal('withdraw')}
        >
          Withdraw
        </button>
      </div>
      <h2>Transactions</h2>
      <table className="tx-table" data-testid="transaction-history-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Amount</th>
            <th>Balance</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {!transactions.length && (
            <tr>
              <td colSpan={4} className="empty-copy">
                No ledger entries yet.
              </td>
            </tr>
          )}
          {transactions.map((entry) => (
            <tr key={entry.id} data-testid={`transaction-row-${entry.id}`}>
              <td>{entry.type}</td>
              <td>{formatWalletBalance(entry.amount)}</td>
              <td>{formatWalletBalance(entry.runningBalance)}</td>
              <td>{new Date(entry.timestamp).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {modal === 'deposit' && (
        <MoneyModal
          testId="wallet-deposit-modal"
          title="Deposit"
          inputId="wallet-deposit-amount-input"
          confirmId="wallet-deposit-confirm"
          submitLabel="Deposit"
          onClose={() => setModal(null)}
          onSubmit={deposit}
        />
      )}
      {modal === 'withdraw' && (
        <MoneyModal
          testId="wallet-withdraw-modal"
          title="Withdraw"
          inputId="wallet-withdraw-amount-input"
          confirmId="wallet-withdraw-confirm"
          submitLabel="Withdraw"
          onClose={() => setModal(null)}
          onSubmit={withdraw}
        />
      )}
    </section>
  )
}
