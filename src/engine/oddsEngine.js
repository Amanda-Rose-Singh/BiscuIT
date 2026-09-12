import {
  getBets,
  getRaces,
  getState,
  getWallet,
  lockRace as lockRaceApi,
  settleRace as settleRaceApi,
} from '../api/mockApi.js'

export function startOddsEngine() {
  window.__ODDS_ENGINE__ = {
    getState: async () => {
      const result = await getState()
      return result.ok ? result.data : null
    },
    getRaces: async () => {
      const result = await getRaces()
      return result.ok ? result.data : []
    },
    getWallet: async () => {
      const result = await getWallet()
      return result.ok ? result.data.balance : 0
    },
    getBets: async () => {
      const result = await getBets()
      return result.ok ? result.data : []
    },
    getRace: async (raceId) => {
      const result = await getRaces()
      return result.ok ? result.data.find((race) => race.id === raceId) ?? null : null
    },
    getPostTime: async (raceId) => {
      const race = await window.__ODDS_ENGINE__.getRace(raceId)
      return race ? race.postTime : null
    },
    getOdds: async (raceId, runnerId) => {
      const race = await window.__ODDS_ENGINE__.getRace(raceId)
      const runner = race?.runners.find((item) => item.id === runnerId)
      return runner ? runner.odds : null
    },
    lockRace: (raceId) => lockRaceApi(raceId),
    settleRace: (raceId) => settleRaceApi(raceId),
  }
}

export function stopOddsEngine() {}
