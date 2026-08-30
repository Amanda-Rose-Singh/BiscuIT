import {
  addBet,
  debitWallet,
  getBetsSync,
  getRaceSync,
  getRacesSync,
  getWalletSync,
  subscribe,
} from './serverState.js'

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function mockLatency() {
  return 150 + Math.floor(Math.random() * 451)
}

async function withLatency(work) {
  await wait(mockLatency())
  return work()
}

export function subscribeToOdds(listener) {
  return subscribe(listener)
}

export function getRaces() {
  return withLatency(() => ({ ok: true, data: getRacesSync() }))
}

export function getRace(raceId) {
  return withLatency(() => {
    const race = getRaceSync(raceId)
    if (!race) {
      return { ok: false, error: 'Race not found' }
    }
    return { ok: true, data: race }
  })
}

export function getWallet() {
  return withLatency(() => ({ ok: true, data: { balance: getWalletSync() } }))
}

export function getBets() {
  return withLatency(() => ({ ok: true, data: getBetsSync() }))
}

export function applyWalletDebit(amount) {
  return withLatency(() => {
    debitWallet(amount)
    return { ok: true, data: { balance: getWalletSync() } }
  })
}

export function placeBet({ raceId, runnerId, stake, odds }) {
  return withLatency(() => {
    const race = getRaceSync(raceId)
    if (!race) {
      return { ok: false, error: 'Race not found' }
    }
    if (race.status !== 'upcoming') {
      return { ok: false, error: 'Betting is closed for this race' }
    }
    const runner = race.runners.find((item) => item.id === runnerId)
    if (!runner) {
      return { ok: false, error: 'Runner not found' }
    }
    if (!(stake > 0)) {
      return { ok: false, error: 'Stake must be greater than 0' }
    }
    if (getWalletSync() < stake) {
      return { ok: false, error: 'Insufficient funds' }
    }
    if (Math.random() < 0.05) {
      const error = Math.random() < 0.5 ? 'Insufficient funds' : 'Bet rejected'
      return { ok: false, error }
    }

    const bet = addBet({
      raceId,
      raceName: race.name,
      runnerId,
      runnerName: runner.name,
      stake,
      odds,
      potentialPayout: stake * odds,
      status: 'pending',
      settledPayout: null,
    })

    return { ok: true, data: bet }
  })
}
