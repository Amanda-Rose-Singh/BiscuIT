import { createSeedRaces } from '../src/data/seed.js'
import { DEFAULT_USER_ID, MAX_SINGLE_STAKE, STARTING_BALANCE } from '../src/constants.js'
import { validateStakeAmount } from '../src/utils/stake.js'
import { placeOdds } from '../src/utils/display.js'

const users = {
  [DEFAULT_USER_ID]: { balance: STARTING_BALANCE },
}

let races = createSeedRaces()
let bets = []
let transactions = []
let nextBetId = 1
let nextTxId = 1
let debugState = { delayMs: 0, forceNextBetError: false }
const blackjackHands = new Map()
const pokerHands = new Map()

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100
}

export function getDebug() {
  return { ...debugState }
}

export function setDebug(partial) {
  if (partial.delayMs != null) {
    const delayMs = Math.min(3000, Math.max(0, Number(partial.delayMs) || 0))
    debugState.delayMs = delayMs
  }
  if (partial.forceNextBetError != null) {
    debugState.forceNextBetError = Boolean(partial.forceNextBetError)
  }
  return getDebug()
}

export function consumeForceBetError() {
  if (!debugState.forceNextBetError) {
    return false
  }
  debugState.forceNextBetError = false
  return true
}

export function getBalance(userId = DEFAULT_USER_ID) {
  return users[userId]?.balance ?? 0
}

export function getRaces() {
  return structuredClone(races)
}

export function getRace(raceId) {
  const race = races.find((item) => item.id === raceId)
  return race ? structuredClone(race) : null
}

export function getBets(userId = DEFAULT_USER_ID) {
  return structuredClone(bets.filter((bet) => bet.userId === userId))
}

export function getTransactions(userId = DEFAULT_USER_ID) {
  return structuredClone(
    transactions.filter((entry) => entry.userId === userId),
  )
}

export function getStateSnapshot(userId = DEFAULT_USER_ID) {
  return {
    races: getRaces(),
    walletBalance: getBalance(userId),
    bets: getBets(userId),
    transactions: getTransactions(userId),
  }
}

export function updateRace(raceId, updater) {
  races = races.map((race) => (race.id === raceId ? updater(race) : race))
}

function appendLedger({
  userId = DEFAULT_USER_ID,
  type,
  amount,
  betId = null,
  marketId = null,
  note = '',
}) {
  const runningBalance = getBalance(userId)
  const entry = {
    id: `tx-${nextTxId}`,
    userId,
    type,
    amount: roundMoney(amount),
    timestamp: Date.now(),
    runningBalance: roundMoney(runningBalance),
    betId,
    marketId,
    note,
  }
  nextTxId += 1
  transactions = [entry, ...transactions]
  return structuredClone(entry)
}

function creditWallet(userId, amount) {
  users[userId].balance = roundMoney(users[userId].balance + amount)
}

function debitWallet(userId, amount) {
  users[userId].balance = roundMoney(users[userId].balance - amount)
}

export function deposit(userId, amount) {
  const parsed = validateStakeAmount(amount, {
    balance: Number.POSITIVE_INFINITY,
    maxStake: 100000,
  })
  if (!parsed.ok) {
    return { ok: false, error: parsed.error.replace('Stake', 'Amount') }
  }
  creditWallet(userId, parsed.value)
  appendLedger({
    userId,
    type: 'deposit',
    amount: parsed.value,
    note: 'Wallet deposit',
  })
  return { ok: true, data: { balance: getBalance(userId) } }
}

export function withdraw(userId, amount) {
  const parsed = validateStakeAmount(amount, {
    balance: getBalance(userId),
    maxStake: 100000,
  })
  if (!parsed.ok) {
    return {
      ok: false,
      error:
        parsed.error === 'Stake exceeds current wallet balance.'
          ? 'Withdrawal exceeds current wallet balance.'
          : parsed.error.replace('Stake', 'Amount'),
    }
  }
  debitWallet(userId, parsed.value)
  appendLedger({
    userId,
    type: 'withdrawal',
    amount: parsed.value,
    note: 'Wallet withdrawal',
  })
  return { ok: true, data: { balance: getBalance(userId) } }
}

function racingOdds(race, selectionId, market) {
  const runner = race.runners.find((item) => item.id === selectionId)
  if (!runner) {
    return null
  }
  const win = runner.odds
  return market === 'place' ? placeOdds(win) : win
}

export function placeBet({
  userId = DEFAULT_USER_ID,
  marketId,
  selectionId,
  stake,
  oddsSeen,
  market = 'win',
  label,
  instantOutcome,
}) {
  const validation = validateStakeAmount(stake, {
    balance: getBalance(userId),
    maxStake: MAX_SINGLE_STAKE,
  })
  if (!validation.ok) {
    return { ok: false, error: validation.error }
  }
  const amount = validation.value

  const race = races.find((item) => item.id === marketId)
  let odds = Number(oddsSeen)
  let raceName = label?.raceName
  let runnerName = label?.runnerName
  let game = label?.game ?? null

  if (race) {
    if (race.status !== 'upcoming') {
      return { ok: false, error: 'Betting is closed for this race' }
    }
    const priced = racingOdds(race, selectionId, market)
    if (priced == null) {
      return { ok: false, error: 'Runner not found' }
    }
    odds = priced
    raceName = race.name
    const runner = race.runners.find((item) => item.id === selectionId)
    runnerName = `${runner.name}${market === 'place' ? ' (Place)' : ''}`
  } else if (!String(marketId).startsWith('casino-')) {
    return { ok: false, error: 'Market not found' }
  }

  if (!Number.isFinite(odds) || odds < 1.1) {
    return { ok: false, error: 'Odds are invalid' }
  }

  debitWallet(userId, amount)
  const record = {
    id: `bet-${nextBetId}`,
    userId,
    marketId,
    selectionId,
    raceId: race ? race.id : marketId,
    runnerId: selectionId,
    raceName: raceName || marketId,
    runnerName: runnerName || selectionId,
    game,
    market,
    stake: amount,
    odds,
    potentialPayout: roundMoney(amount * odds),
    status: 'pending',
    settledPayout: null,
  }
  nextBetId += 1
  bets = [record, ...bets]
  appendLedger({
    userId,
    type: 'bet-debit',
    amount,
    betId: record.id,
    marketId,
    note: `Stake on ${record.runnerName}`,
  })

  if (instantOutcome) {
    const settled = settleBetRecord(record.id, instantOutcome)
    return { ok: true, data: settled }
  }

  return { ok: true, data: structuredClone(record) }
}

function settleBetRecord(betId, outcome) {
  const current = bets.find((bet) => bet.id === betId)
  if (!current || current.status !== 'pending') {
    return current ? structuredClone(current) : null
  }

  let status = outcome
  let settledPayout = 0
  if (outcome === 'won') {
    settledPayout = roundMoney(current.stake * current.odds)
  } else if (outcome === 'push') {
    settledPayout = current.stake
  } else {
    status = 'lost'
    settledPayout = 0
  }

  if (settledPayout > 0) {
    creditWallet(current.userId, settledPayout)
    appendLedger({
      userId: current.userId,
      type: 'bet-credit',
      amount: settledPayout,
      betId: current.id,
      marketId: current.marketId,
      note: `${status} ${current.runnerName}`,
    })
  }

  bets = bets.map((bet) =>
    bet.id === betId ? { ...bet, status, settledPayout } : bet,
  )
  return structuredClone(bets.find((bet) => bet.id === betId))
}

export function settlePendingBet(betId, outcome, odds) {
  if (odds != null) {
    bets = bets.map((bet) =>
      bet.id === betId && bet.status === 'pending'
        ? {
            ...bet,
            odds,
            potentialPayout: roundMoney(bet.stake * odds),
          }
        : bet,
    )
  }
  const settled = settleBetRecord(betId, outcome)
  if (!settled) {
    return { ok: false, error: 'Bet not found or already settled.' }
  }
  return { ok: true, data: settled }
}

export function settleBetsForRace(raceId, winnerId) {
  const pending = bets.filter(
    (bet) => bet.marketId === raceId && bet.status === 'pending',
  )
  pending.forEach((bet) => {
    const won =
      bet.selectionId === winnerId && (bet.market || 'win') === 'win'
        ? true
        : bet.selectionId === winnerId && bet.market === 'place'
          ? true
          : false
    // Place bets: win if selection is the winner (simplified: place pays on winner only)
    settleBetRecord(bet.id, won ? 'won' : 'lost')
  })
}

export function settleMarketAdmin(marketId, outcome) {
  const race = races.find((item) => item.id === marketId)
  if (race?.status === 'settled') {
    return { ok: false, error: 'Market is already settled.' }
  }
  const pending = bets.filter(
    (bet) => bet.marketId === marketId && bet.status === 'pending',
  )
  if (race && race.status === 'settled') {
    return { ok: false, error: 'Market is already settled.' }
  }
  if (!['won', 'lost', 'push'].includes(outcome)) {
    return { ok: false, error: 'Outcome must be won, lost, or push.' }
  }
  pending.forEach((bet) => settleBetRecord(bet.id, outcome))
  if (race) {
    updateRace(marketId, (current) => ({
      ...current,
      status: 'settled',
      winnerId: current.winnerId || (outcome === 'won' ? 'admin' : null),
      adminOutcome: outcome,
    }))
  }
  return {
    ok: true,
    data: {
      settled: pending.length,
      outcome,
      balance: getBalance(),
      bets: getBets(),
    },
  }
}

export function getBlackjackHand(userId) {
  const hand = blackjackHands.get(userId)
  return hand ? structuredClone(hand) : null
}

export function setBlackjackHand(userId, hand) {
  if (!hand) {
    blackjackHands.delete(userId)
    return
  }
  blackjackHands.set(userId, hand)
}

export function getPokerHand(userId) {
  const hand = pokerHands.get(userId)
  return hand ? structuredClone(hand) : null
}

export function setPokerHand(userId, hand) {
  if (!hand) {
    pokerHands.delete(userId)
    return
  }
  pokerHands.set(userId, hand)
}

export { MAX_SINGLE_STAKE, DEFAULT_USER_ID }
