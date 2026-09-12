const API_BASE = '/api'

async function request(path, options = {}) {
  try {
    const { headers, signal, ...rest } = options
    const response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: { 'Content-Type': 'application/json', ...headers },
      signal: signal ?? AbortSignal.timeout(20000),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload.ok === false) {
      return {
        ok: false,
        error: payload.error || `Request failed (${response.status})`,
        status: response.status,
      }
    }
    return { ok: true, data: payload.data, status: response.status }
  } catch {
    return { ok: false, error: 'Network error. Is the API server running?' }
  }
}

export function getRaces() {
  return request('/races')
}

export function getRace(raceId) {
  return request(`/races/${raceId}`)
}

export function getWallet() {
  return request('/user/balance')
}

export function getBets() {
  return request('/bets')
}

export function getTransactions() {
  return request('/transactions')
}

export function getState() {
  return request('/state')
}

export function depositWallet(amount) {
  return request('/wallet/deposit', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  })
}

export function withdrawWallet(amount) {
  return request('/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  })
}

export function placeBet({ raceId, runnerId, stake, odds, market, marketId, selectionId, oddsSeen }) {
  return request('/bets', {
    method: 'POST',
    body: JSON.stringify({
      marketId: marketId || raceId,
      selectionId: selectionId || runnerId,
      stake,
      oddsSeen: oddsSeen ?? odds,
      market,
    }),
  })
}

export function playCasino(body) {
  return request('/casino/play', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function adminSettle(marketId, outcome) {
  return request('/admin/settle', {
    method: 'POST',
    body: JSON.stringify({ marketId, outcome }),
  })
}

export function lockRace(raceId) {
  return request('/admin/lock', {
    method: 'POST',
    body: JSON.stringify({ raceId, marketId: raceId }),
  })
}

export function settleRace(raceId) {
  return request('/admin/settle-winner', {
    method: 'POST',
    body: JSON.stringify({ raceId, marketId: raceId }),
  })
}

export function getDebugSettings() {
  return request('/debug')
}

export function setDebugSettings(partial) {
  return request('/debug', {
    method: 'POST',
    body: JSON.stringify(partial),
  })
}

export function applyWalletDebit() {
  return Promise.resolve({
    ok: false,
    error: 'Wallet debit is applied on the server when a bet is placed.',
  })
}

export function subscribeToOdds(listener) {
  let stopped = false
  const tick = async () => {
    const result = await getState()
    if (stopped || !result.ok) {
      return
    }
    listener(result.data)
  }
  tick()
  const timer = setInterval(tick, 1000)
  return () => {
    stopped = true
    clearInterval(timer)
  }
}
