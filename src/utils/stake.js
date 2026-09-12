export function parseStake(raw) {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) {
      return { ok: false, error: 'Stake must be a number.' }
    }
    return { ok: true, value: raw }
  }
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Stake must be a number.' }
  }
  const trimmed = raw.trim()
  if (!trimmed) {
    return { ok: false, error: 'Stake must be a number.' }
  }
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { ok: false, error: 'Stake must be a number. Letters and symbols are not allowed.' }
  }
  const value = Number(trimmed)
  if (!Number.isFinite(value)) {
    return { ok: false, error: 'Stake must be a number.' }
  }
  return { ok: true, value }
}

export function validateStakeAmount(raw, { balance, maxStake }) {
  const parsed = parseStake(raw)
  if (!parsed.ok) {
    return parsed
  }
  const value = parsed.value
  if (value < 0) {
    return { ok: false, error: 'Stake cannot be negative.' }
  }
  if (value === 0) {
    return { ok: false, error: 'Stake must be greater than 0.' }
  }
  if (value > maxStake) {
    return {
      ok: false,
      error: `Stake cannot exceed the max single-bet limit of ${maxStake}.`,
    }
  }
  if (value > balance) {
    return { ok: false, error: 'Stake exceeds current wallet balance.' }
  }
  return { ok: true, value }
}
