export function formatWalletBalance(value) {
  return Math.trunc(Number(value) * 100) / 100
}

export function formatPayout(value) {
  return Math.round(Number(value) * 100) / 100
}

export function formatOdds(value) {
  return Number(value).toFixed(2)
}
