import { createSeedRaces, STARTING_BALANCE } from '../data/seed.js'

let races = createSeedRaces()
let walletBalance = STARTING_BALANCE
let bets = []
let nextBetId = 1
const listeners = new Set()

export function getStateSnapshot() {
  return {
    races: structuredClone(races),
    walletBalance,
    bets: structuredClone(bets),
  }
}

export function getRacesSync() {
  return structuredClone(races)
}

export function getRaceSync(raceId) {
  const race = races.find((item) => item.id === raceId)
  return race ? structuredClone(race) : null
}

export function getWalletSync() {
  return walletBalance
}

export function getBetsSync() {
  return structuredClone(bets)
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notify() {
  const snapshot = getStateSnapshot()
  listeners.forEach((listener) => listener(snapshot))
}

export function setRaces(nextRaces) {
  races = nextRaces
  notify()
}

export function updateRace(raceId, updater) {
  races = races.map((race) => (race.id === raceId ? updater(race) : race))
  notify()
}

export function creditWallet(amount) {
  walletBalance += amount
  notify()
}

export function debitWallet(amount) {
  walletBalance -= amount
  notify()
}

export function addBet(bet) {
  const record = {
    ...bet,
    id: `bet-${nextBetId}`,
  }
  nextBetId += 1
  bets = [record, ...bets]
  notify()
  return structuredClone(record)
}

export function settleBetsForRace(raceId, winnerId) {
  bets = bets.map((bet) => {
    if (bet.raceId !== raceId || bet.status !== 'pending') {
      return bet
    }
    const won = bet.runnerId === winnerId
    const settledPayout = won ? bet.stake * bet.odds : 0
    if (won) {
      walletBalance += settledPayout
    }
    return {
      ...bet,
      status: won ? 'won' : 'lost',
      settledPayout,
    }
  })
  notify()
}

export function resetServerState() {
  races = createSeedRaces()
  walletBalance = STARTING_BALANCE
  bets = []
  nextBetId = 1
  notify()
}
