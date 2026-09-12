import { create } from 'zustand'
import {
  adminSettle,
  depositWallet,
  getBets,
  getRaces,
  getTransactions,
  getWallet,
  placeBet,
  playCasino,
  subscribeToOdds,
  withdrawWallet,
} from '../api/mockApi.js'
import { MAX_SINGLE_STAKE } from '../constants.js'
import { formatPayout } from '../utils/money.js'
import { placeOdds } from '../utils/display.js'
import { validateStakeAmount } from '../utils/stake.js'

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

function firstStakeError(legs, walletBalance) {
  for (const leg of legs) {
    const result = validateStakeAmount(leg.stake, {
      balance: walletBalance,
      maxStake: MAX_SINGLE_STAKE,
    })
    if (!result.ok) {
      return result.error
    }
  }
  const totalStake = legs.reduce((sum, leg) => sum + Number(leg.stake), 0)
  if (totalStake > walletBalance) {
    return 'Insufficient funds for this betslip.'
  }
  return ''
}

export const useAppStore = create((set, get) => ({
  view: 'races',
  selectedRaceId: null,
  races: [],
  walletBalance: 0,
  bets: [],
  transactions: [],
  legs: [],
  laggedOdds: {},
  payoutTotal: 0,
  loading: false,
  placing: false,
  errorMessage: '',
  infoMessage: '',
  stakeValidationError: '',
  toastMessage: '',
  oddsConfirmPending: false,

  setView: (view) => set({ view, errorMessage: '', infoMessage: '' }),
  dismissToast: () => set({ toastMessage: '' }),
  openRace: (raceId) => set({ view: 'race-detail', selectedRaceId: raceId }),

  setStake: (legIndex, stake) => {
    const legs = get().legs.map((leg, index) =>
      index === legIndex ? { ...leg, stake } : leg,
    )
    const payoutTotal = formatPayout(
      payoutFromOddsMap(legs, get().laggedOdds, get().races),
    )
    const stakeValidationError = firstStakeError(legs, get().walletBalance)
    set({ legs, payoutTotal, errorMessage: '', stakeValidationError })
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
      stakeValidationError: firstStakeError(legs, get().walletBalance),
    })
  },

  clearSlip: () =>
    set({
      legs: [],
      payoutTotal: 0,
      oddsConfirmPending: false,
      errorMessage: '',
      infoMessage: '',
      stakeValidationError: '',
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
      stakeValidationError: firstStakeError(legs, get().walletBalance),
    })
  },

  hydrate: async () => {
    set({ loading: true, errorMessage: '' })
    const [racesResult, walletResult, betsResult, txResult] = await Promise.all([
      getRaces(),
      getWallet(),
      getBets(),
      getTransactions(),
    ])
    if (!racesResult.ok) {
      set({ loading: false, errorMessage: racesResult.error, toastMessage: racesResult.error })
      return
    }
    set({
      loading: false,
      races: racesResult.data,
      walletBalance: walletResult.ok ? walletResult.data.balance : 0,
      bets: betsResult.ok ? betsResult.data : [],
      transactions: txResult.ok ? txResult.data : [],
      laggedOdds: extractOddsMap(racesResult.data),
    })
  },

  refreshAccount: async () => {
    const [walletResult, betsResult, txResult] = await Promise.all([
      getWallet(),
      getBets(),
      getTransactions(),
    ])
    set({
      walletBalance: walletResult.ok ? walletResult.data.balance : get().walletBalance,
      bets: betsResult.ok ? betsResult.data : get().bets,
      transactions: txResult.ok ? txResult.data : get().transactions,
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
      transactions: snapshot.transactions ?? get().transactions,
      laggedOdds: extractOddsMap(snapshot.races),
      payoutTotal,
    })
  },

  deposit: async (amount) => {
    const result = await depositWallet(amount)
    if (!result.ok) {
      return result
    }
    await get().refreshAccount()
    return result
  },

  withdraw: async (amount) => {
    const result = await withdrawWallet(amount)
    if (!result.ok) {
      return result
    }
    await get().refreshAccount()
    return result
  },

  settleAdmin: async (marketId, outcome) => {
    const result = await adminSettle(marketId, outcome)
    await get().hydrate()
    return result
  },

  runCasino: async (payload) => {
    set({ placing: true, toastMessage: '' })
    const result = await playCasino(payload)
    if (!result.ok) {
      const toast = result.status === 500 ? result.error : ''
      set({
        placing: false,
        toastMessage: toast,
        errorMessage: toast ? '' : result.error,
      })
      return result
    }
    await get().refreshAccount()
    set({ placing: false })
    return result
  },

  placeBets: async () => {
    const { legs, races, walletBalance, oddsConfirmPending } = get()
    if (!legs.length) {
      set({ errorMessage: 'Add a selection before placing a bet.' })
      return
    }

    const stakeError = firstStakeError(legs, walletBalance)
    if (stakeError) {
      set({ errorMessage: stakeError, stakeValidationError: stakeError })
      return
    }

    for (const leg of legs) {
      const race = races.find((item) => item.id === leg.raceId)
      if (!race || race.status !== 'upcoming') {
        set({
          errorMessage: `Betting is closed for ${leg.raceName}. Remove locked legs to continue.`,
        })
        return
      }
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

    set({ placing: true, errorMessage: '', infoMessage: '', toastMessage: '' })

    const remaining = []
    const succeeded = []
    let failureMessage = ''
    let toastMessage = ''

    for (let index = 0; index < legs.length; index += 1) {
      const leg = legs[index]
      const liveOdds = currentOddsForLeg(get().races, leg)
      const result = await placeBet({
        raceId: leg.raceId,
        runnerId: leg.runnerId,
        stake: Number(leg.stake),
        odds: oddsMoved ? liveOdds : leg.oddsAtAdd,
        market: leg.market,
      })
      if (result.ok) {
        succeeded.push(leg)
      } else {
        failureMessage = result.error
        if (result.status === 500) {
          toastMessage = result.error
        }
        remaining.push(leg, ...legs.slice(index + 1))
        break
      }
    }

    if (failureMessage) {
      await get().refreshAccount()
      set({
        placing: false,
        legs: remaining,
        payoutTotal: formatPayout(
          payoutFromOddsMap(remaining, get().laggedOdds, get().races),
        ),
        errorMessage: toastMessage ? '' : failureMessage,
        toastMessage,
        oddsConfirmPending: false,
      })
      return
    }

    await get().refreshAccount()
    set({
      placing: false,
      legs: [],
      payoutTotal: 0,
      oddsConfirmPending: false,
      infoMessage: succeeded.length > 1 ? 'Bets placed.' : 'Bet placed.',
      stakeValidationError: '',
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
