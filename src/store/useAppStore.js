import { create } from 'zustand'
import {
  applyWalletDebit,
  getBets,
  getRaces,
  getWallet,
  placeBet,
  subscribeToOdds,
} from '../api/mockApi.js'
import { formatPayout } from '../utils/money.js'
import { placeOdds } from '../utils/display.js'

function extractOddsMap(races) {
  const map = {}
  races.forEach((race) => {
    race.runners.forEach((runner) => {
      map[`${race.id}:${runner.id}`] = runner.odds
    })
  })
  return map
}

function currentOddsForLeg(races, leg) {
  const race = races.find((item) => item.id === leg.raceId)
  const runner = race?.runners.find((item) => item.id === leg.runnerId)
  const win = runner?.odds ?? leg.oddsAtAdd
  if (leg.market === 'place') {
    return placeOdds(win)
  }
  return win
}

function payoutFromOddsMap(legs, oddsMap, races) {
  return legs.reduce((sum, leg) => {
    const key = `${leg.raceId}:${leg.runnerId}`
    const mapped = oddsMap[key]
    const odds =
      mapped == null
        ? currentOddsForLeg(races, leg)
        : leg.market === 'place'
          ? placeOdds(mapped)
          : mapped
    const stake = Number(leg.stake) || 0
    return sum + stake * odds
  }, 0)
}

export const useAppStore = create((set, get) => ({
  view: 'races',
  selectedRaceId: null,
  races: [],
  walletBalance: 0,
  bets: [],
  legs: [],
  laggedOdds: {},
  payoutTotal: 0,
  loading: false,
  placing: false,
  errorMessage: '',
  infoMessage: '',
  oddsConfirmPending: false,

  setView: (view) => set({ view, errorMessage: '', infoMessage: '' }),

  openRace: (raceId) => set({ view: 'race-detail', selectedRaceId: raceId }),

  setStake: (legIndex, stake) => {
    const legs = get().legs.map((leg, index) =>
      index === legIndex ? { ...leg, stake } : leg,
    )
    const payoutTotal = formatPayout(
      payoutFromOddsMap(legs, get().laggedOdds, get().races),
    )
    set({ legs, payoutTotal, errorMessage: '' })
  },

  removeLeg: (legIndex) => {
    const legs = get().legs.filter((_, index) => index !== legIndex)
    const payoutTotal = formatPayout(
      payoutFromOddsMap(legs, get().laggedOdds, get().races),
    )
    set({
      legs,
      payoutTotal,
      oddsConfirmPending: false,
      errorMessage: '',
    })
  },

  clearSlip: () =>
    set({
      legs: [],
      payoutTotal: 0,
      oddsConfirmPending: false,
      errorMessage: '',
      infoMessage: '',
    }),

  addLeg: (raceId, runnerId, market = 'win') => {
    const race = get().races.find((item) => item.id === raceId)
    if (!race) {
      return
    }
    if (race.status !== 'upcoming') {
      set({
        errorMessage: 'This race is locked. New bets cannot be added.',
      })
      return
    }
    const runner = race.runners.find((item) => item.id === runnerId)
    if (!runner) {
      return
    }
    const marketType = market === 'place' ? 'place' : 'win'
    const exists = get().legs.some(
      (leg) =>
        leg.raceId === raceId &&
        leg.runnerId === runnerId &&
        (leg.market || 'win') === marketType,
    )
    if (exists) {
      set({ infoMessage: 'That runner is already on the betslip.' })
      return
    }
    const oddsAtAdd =
      marketType === 'place' ? placeOdds(runner.odds) : runner.odds
    const legs = [
      ...get().legs,
      {
        raceId,
        raceName: race.name,
        runnerId,
        runnerName: runner.name,
        market: marketType,
        oddsAtAdd,
        stake: '10',
      },
    ]
    const payoutTotal = formatPayout(
      payoutFromOddsMap(legs, get().laggedOdds, get().races),
    )
    set({
      legs,
      payoutTotal,
      errorMessage: '',
      infoMessage: '',
      oddsConfirmPending: false,
    })
  },

  hydrate: async () => {
    set({ loading: true, errorMessage: '' })
    const [racesResult, walletResult, betsResult] = await Promise.all([
      getRaces(),
      getWallet(),
      getBets(),
    ])
    if (!racesResult.ok) {
      set({ loading: false, errorMessage: racesResult.error })
      return
    }
    set({
      loading: false,
      races: racesResult.data,
      walletBalance: walletResult.ok ? walletResult.data.balance : 0,
      bets: betsResult.ok ? betsResult.data : [],
      laggedOdds: extractOddsMap(racesResult.data),
    })
  },

  applySnapshot: (snapshot) => {
    const { legs, laggedOdds } = get()
    const payoutTotal = formatPayout(
      payoutFromOddsMap(legs, laggedOdds, snapshot.races),
    )
    set({
      races: snapshot.races,
      walletBalance: snapshot.walletBalance,
      bets: snapshot.bets,
      laggedOdds: extractOddsMap(snapshot.races),
      payoutTotal,
    })
  },

  placeBets: async () => {
    const { legs, races, walletBalance, oddsConfirmPending } = get()
    if (!legs.length) {
      set({ errorMessage: 'Add a selection before placing a bet.' })
      return
    }

    for (const leg of legs) {
      const stake = Number(leg.stake)
      if (!(stake > 0)) {
        set({ errorMessage: 'Each stake must be greater than 0.' })
        return
      }
      const race = races.find((item) => item.id === leg.raceId)
      if (!race || race.status !== 'upcoming') {
        set({
          errorMessage: `Betting is closed for ${leg.raceName}. Remove locked legs to continue.`,
        })
        return
      }
    }

    const totalStake = legs.reduce((sum, leg) => sum + Number(leg.stake), 0)
    if (totalStake > walletBalance) {
      set({ errorMessage: 'Insufficient funds for this betslip.' })
      return
    }

    const oddsMoved = legs.some((leg) => {
      const live = currentOddsForLeg(races, leg)
      return live !== leg.oddsAtAdd
    })
    if (oddsMoved && !oddsConfirmPending) {
      set({
        oddsConfirmPending: true,
        errorMessage: '',
      })
      return
    }

    set({ placing: true, errorMessage: '', infoMessage: '' })

    const remaining = []
    const succeeded = []
    let failureMessage = ''

    for (let index = 0; index < legs.length; index += 1) {
      const leg = legs[index]
      const liveOdds = currentOddsForLeg(get().races, leg)
      const result = await placeBet({
        raceId: leg.raceId,
        runnerId: leg.runnerId,
        stake: Number(leg.stake),
        odds: oddsMoved ? liveOdds : leg.oddsAtAdd,
      })
      if (result.ok) {
        succeeded.push(leg)
      } else {
        failureMessage = result.error
        remaining.push(leg, ...legs.slice(index + 1))
        break
      }
    }

    if (failureMessage) {
      const betsResult = await getBets()
      set({
        placing: false,
        legs: remaining,
        payoutTotal: formatPayout(
          payoutFromOddsMap(remaining, get().laggedOdds, get().races),
        ),
        bets: betsResult.ok ? betsResult.data : get().bets,
        errorMessage: failureMessage,
        oddsConfirmPending: false,
      })
      return
    }

    const debit = await applyWalletDebit(totalStake)
    const betsResult = await getBets()
    const walletResult = await getWallet()

    set({
      placing: false,
      legs: [],
      payoutTotal: 0,
      oddsConfirmPending: false,
      bets: betsResult.ok ? betsResult.data : get().bets,
      walletBalance: debit.ok
        ? debit.data.balance
        : walletResult.ok
          ? walletResult.data.balance
          : get().walletBalance,
      infoMessage: succeeded.length > 1 ? 'Bets placed.' : 'Bet placed.',
    })
  },
}))

let subscribed = false

export function bindStoreToEngine() {
  if (subscribed) {
    return
  }
  subscribed = true
  subscribeToOdds((snapshot) => {
    useAppStore.getState().applySnapshot(snapshot)
  })
}
