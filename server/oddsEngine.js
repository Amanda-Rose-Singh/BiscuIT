import {
  getRace,
  getRaces,
  settleBetsForRace,
  updateRace,
} from './store.js'

const ODDS_FLOOR = 1.1
const ODDS_CEILING = 25

let marketTimer = null
const settleTimers = new Map()

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

function tickMarket() {
  const now = Date.now()
  getRaces().forEach((race) => {
    if (race.status === 'upcoming') {
      if (now >= race.postTime - 1500) {
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
  marketTimer = setTimeout(tickMarket, nextMarketDelay())
}

function scheduleRaceFinish(raceId, durationMs) {
  const startTimer = setTimeout(() => {
    const race = getRace(raceId)
    if (!race || race.status !== 'in-progress') {
      settleTimers.delete(raceId)
      return
    }
    updateRace(raceId, (current) => {
      if (current.status !== 'in-progress') {
        return current
      }
      return { ...current, status: 'closed' }
    })
    const closeTimer = setTimeout(() => {
      settleRace(raceId)
      settleTimers.delete(raceId)
    }, 1200)
    settleTimers.set(raceId, closeTimer)
  }, durationMs)
  settleTimers.set(raceId, startTimer)
}

export function clearSettleTimer(raceId) {
  const timer = settleTimers.get(raceId)
  if (timer) {
    clearTimeout(timer)
    settleTimers.delete(raceId)
  }
}

export function lockRace(raceId) {
  const race = getRace(raceId)
  if (!race || race.status !== 'upcoming') {
    return { ok: false, error: 'Race cannot be locked' }
  }
  updateRace(raceId, (current) => ({
    ...current,
    status: 'in-progress',
  }))
  scheduleRaceFinish(raceId, race.raceDurationMs)
  return { ok: true }
}

function resumeLiveRaces() {
  getRaces().forEach((race) => {
    if (race.status === 'in-progress') {
      scheduleRaceFinish(race.id, race.raceDurationMs)
    }
  })
}

export function settleRace(raceId) {
  const race = getRace(raceId)
  if (!race || race.status === 'settled') {
    return { ok: false, error: 'Race already settled' }
  }
  const winnerId = pickWinner(race)
  updateRace(raceId, (current) => ({
    ...current,
    status: 'settled',
    winnerId,
  }))
  settleBetsForRace(raceId, winnerId)
  clearSettleTimer(raceId)
  return { ok: true, data: { winnerId } }
}

export function startOddsEngine() {
  if (marketTimer) {
    return
  }
  scheduleMarketTick()
  resumeLiveRaces()
}

export function stopOddsEngine() {
  if (marketTimer) {
    clearTimeout(marketTimer)
    marketTimer = null
  }
  settleTimers.forEach((timer) => clearTimeout(timer))
  settleTimers.clear()
}
