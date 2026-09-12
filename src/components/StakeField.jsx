import { useState } from 'react'
import { MAX_SINGLE_STAKE } from '../constants.js'
import { validateStakeAmount } from '../utils/stake.js'
import { useAppStore } from '../store/useAppStore.js'

export function StakeField({ testId, value, onChange, disabled }) {
  const balance = useAppStore((state) => state.walletBalance)
  const parsed = validateStakeAmount(value, {
    balance,
    maxStake: MAX_SINGLE_STAKE,
  })
  return (
    <label className="stake-label">
      Stake (max {MAX_SINGLE_STAKE})
      <input
        data-testid={testId}
        data-max-stake={MAX_SINGLE_STAKE}
        type="text"
        inputMode="decimal"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      {!parsed.ok && value !== '' && (
        <span className="error-copy" data-testid="stake-validation-error">
          {parsed.error}
        </span>
      )}
    </label>
  )
}

export function usePlayableStake(initial = '10') {
  const [stake, setStake] = useState(initial)
  const balance = useAppStore((state) => state.walletBalance)
  const parsed = validateStakeAmount(stake, {
    balance,
    maxStake: MAX_SINGLE_STAKE,
  })
  return { stake, setStake, parsed }
}
