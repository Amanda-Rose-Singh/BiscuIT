import {
  getBetsSync,
  getRacesSync,
  getStateSnapshot,
  getWalletSync,
  settleBetsForRace,
  updateRace,
} from '../api/serverState.js'

const ODDS_FLOOR = 1.1
const ODDS_CEILING = 25

function clampOdds(value) {
  const next = Math.min(ODDS_CEILING, Math.max(ODDS_FLOOR, value))
  return Math.round(next * 100) / 100
}

function nudgeOdds(odds) {
  const delta = (Math.random() * 0.36 + 0.04) * (Math.random() < 0.5 ? -1 : 1)
  return clampOdds(odds + delta)
}

function pickWinner(race) {
  const index = Math.floor(Math.random() * race.runners.length)
  return race.runners[index].id
}

function nextMarketDelay() {
  return 2000 + Math.floor(Math.random() * 2000)
}

let marketTimer = null
const settleTimers = new Map()

function tickMarket() {
  const now = Date.now()
  const races = getRacesSync()

  races.forEach((race) => {
    if (race.status === 'upcoming') {
      const readyToLock = now >= race.postTime - 1500
      if (readyToLock) {
        lockRace(race.id)
        return
      }
      updateRace(race.id, (current) => ({
        ...current,
        runners: current.runners.map((runner) => {
          const nextOdds = nudgeOdds(runner.odds)
          return {
            ...runner,
            oddsHistory: [...runner.oddsHistory, runner.odds],
            odds: nextOdds,
          }
        }),
      }))
    }
  })

  scheduleMarketTick()
}

function scheduleMarketTick() {
  marketTimer = window.setTimeout(tickMarket, nextMarketDelay())
}

function lockRace(raceId) {
  const race = getRacesSync().find((item) => item.id === raceId)
  if (!race || race.status !== 'upcoming') {
    return
  }

  updateRace(raceId, (current) => ({
    ...current,
    status: 'in-progress',
  }))

  window.setTimeout(() => {
    updateRace(raceId, (current) => {
      if (current.status !== 'in-progress') {
        return current
      }
      return { ...current, status: 'closed' }
    })

    const closeTimer = window.setTimeout(() => {
      settleRace(raceId)
      settleTimers.delete(raceId)
    }, 1200)
    settleTimers.set(raceId, closeTimer)
  }, race.raceDurationMs)
}

function settleRace(raceId) {
  const race = getRacesSync().find((item) => item.id === raceId)
  if (!race || race.status === 'settled') {
    return
  }
  const winnerId = pickWinner(race)
  updateRace(raceId, (current) => ({
    ...current,
    status: 'settled',
    winnerId,
  }))
  settleBetsForRace(raceId, winnerId)
}

export function startOddsEngine() {
  if (marketTimer) {
    return
  }
  scheduleMarketTick()

  window.__ODDS_ENGINE__ = {
    getState: () => getStateSnapshot(),
    getRaces: () => getRacesSync(),
    getWallet: () => getWalletSync(),
    getBets: () => getBetsSync(),
    getRace: (raceId) => getRacesSync().find((race) => race.id === raceId) ?? null,
    getPostTime: (raceId) => {
      const race = getRacesSync().find((item) => item.id === raceId)
      return race ? race.postTime : null
    },
    getOdds: (raceId, runnerId) => {
      const race = getRacesSync().find((item) => item.id === raceId)
      const runner = race?.runners.find((item) => item.id === runnerId)
      return runner ? runner.odds : null
    },
    lockRace,
    settleRace,
  }
}

export function stopOddsEngine() {
  if (marketTimer) {
    window.clearTimeout(marketTimer)
    marketTimer = null
  }
  settleTimers.forEach((timer) => window.clearTimeout(timer))
  settleTimers.clear()
}
