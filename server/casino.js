import {
  getBalance,
  getBlackjackHand,
  getPokerHand,
  placeBet,
  setBlackjackHand,
  setPokerHand,
  settlePendingBet,
} from './store.js'

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const SUITS = ['S', 'H', 'D', 'C']
const SLOT_SYMBOLS = ['cherry', 'lemon', 'bar', 'seven', 'wild']

function freshDeck() {
  const deck = []
  RANKS.forEach((rank) => {
    SUITS.forEach((suit) => {
      deck.push({ rank, suit })
    })
  })
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function cardValue(card) {
  if (card.rank === 'A') return 11
  if (['K', 'Q', 'J'].includes(card.rank)) return 10
  return Number(card.rank)
}

function handTotal(cards) {
  let total = cards.reduce((sum, card) => sum + cardValue(card), 0)
  let aces = cards.filter((card) => card.rank === 'A').length
  while (total > 21 && aces > 0) {
    total -= 10
    aces -= 1
  }
  return total
}

function formatCard(card) {
  return `${card.rank}${card.suit}`
}

function rouletteColor(n) {
  if (n === 0) return 'green'
  const reds = new Set([
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
  ])
  return reds.has(n) ? 'red' : 'black'
}

function pokerRank(cards) {
  const values = cards.map((card) => {
    if (card.rank === 'A') return 14
    if (card.rank === 'K') return 13
    if (card.rank === 'Q') return 12
    if (card.rank === 'J') return 11
    return Number(card.rank)
  })
  const suits = cards.map((card) => card.suit)
  const counts = {}
  values.forEach((value) => {
    counts[value] = (counts[value] || 0) + 1
  })
  const groups = Object.values(counts).sort((a, b) => b - a)
  const unique = [...values].sort((a, b) => a - b)
  const flush = suits.every((suit) => suit === suits[0])
  const straight = unique.length === 5 && unique[4] - unique[0] === 4
  const royal = flush && straight && unique[0] === 10
  if (royal) return { name: 'Royal flush', odds: 800 }
  if (flush && straight) return { name: 'Straight flush', odds: 50 }
  if (groups[0] === 4) return { name: 'Four of a kind', odds: 25 }
  if (groups[0] === 3 && groups[1] === 2) return { name: 'Full house', odds: 9 }
  if (flush) return { name: 'Flush', odds: 6 }
  if (straight) return { name: 'Straight', odds: 4 }
  if (groups[0] === 3) return { name: 'Three of a kind', odds: 3 }
  if (groups[0] === 2 && groups[1] === 2) return { name: 'Two pair', odds: 2 }
  const pairValue = Number(
    Object.keys(counts).find((key) => counts[key] === 2),
  )
  if (groups[0] === 2 && pairValue >= 11) {
    return { name: 'Jacks or better', odds: 2 }
  }
  return { name: 'High card', odds: 0 }
}

function decorate(result, summary, extra = {}) {
  if (!result.ok) {
    return result
  }
  return {
    ok: true,
    data: {
      ...result.data,
      summary,
      balance: getBalance(result.data.userId),
      ...extra,
    },
  }
}

function instantGame({ userId, game, selection, stake, odds, summary, won, extra }) {
  const placed = placeBet({
    userId,
    marketId: `casino-${game}`,
    selectionId: selection,
    stake,
    oddsSeen: Math.max(odds, 1.1),
    label: { raceName: game, runnerName: selection, game },
    instantOutcome: won ? 'won' : 'lost',
  })
  return decorate(placed, summary, extra)
}

function finishBlackjack(userId, hand) {
  const playerTotal = handTotal(hand.player)
  let dealer = [...hand.dealer]
  while (handTotal(dealer) < 17) {
    dealer = [...dealer, hand.deck.pop()]
  }
  const dealerTotal = handTotal(dealer)
  let outcome = 'lost'
  let summary = `You ${playerTotal}, dealer ${dealerTotal}.`
  let odds = 2
  if (playerTotal > 21) {
    summary = `Bust at ${playerTotal}.`
  } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
    outcome = 'won'
    if (playerTotal === 21 && hand.player.length === 2) {
      odds = 2.5
      summary = `Blackjack ${playerTotal} vs dealer ${dealerTotal}.`
    } else {
      summary = `You ${playerTotal} beat dealer ${dealerTotal}.`
    }
  } else if (playerTotal === dealerTotal) {
    outcome = 'push'
    summary = `Push at ${playerTotal}.`
  }
  const settled = settlePendingBet(hand.betId, outcome, odds)
  setBlackjackHand(userId, null)
  return decorate(settled, summary, {
    player: hand.player.map(formatCard),
    dealer: dealer.map(formatCard),
    playerTotal,
    dealerTotal,
    stage: 'done',
  })
}

export function playCasino({
  userId,
  game,
  action = 'play',
  selection,
  stake,
  holds,
}) {
  if (game === 'dice') {
    const roll = 1 + Math.floor(Math.random() * 6)
    let won = false
    let odds = 5
    let summary = `Rolled ${roll}.`
    if (selection?.startsWith('n-')) {
      const pick = Number(selection.slice(2))
      won = roll === pick
      summary = `Rolled ${roll}. You picked ${pick}.`
    } else if (selection === 'over') {
      won = roll >= 5
      odds = 2.5
      summary = `Rolled ${roll}. Over 4.5.`
    } else if (selection === 'under') {
      won = roll <= 2
      odds = 2.5
      summary = `Rolled ${roll}. Under 2.5.`
    } else {
      return { ok: false, error: 'Pick a dice number 1-6, over, or under.' }
    }
    return instantGame({
      userId,
      game,
      selection,
      stake,
      odds,
      summary,
      won,
      extra: { roll },
    })
  }

  if (game === 'coinflip') {
    if (selection !== 'heads' && selection !== 'tails') {
      return { ok: false, error: 'Pick heads or tails.' }
    }
    const flip = Math.random() < 0.5 ? 'heads' : 'tails'
    return instantGame({
      userId,
      game,
      selection,
      stake,
      odds: 2,
      summary: `Coin landed ${flip}. You picked ${selection}.`,
      won: flip === selection,
      extra: { flip },
    })
  }

  if (game === 'roulette') {
    const number = Math.floor(Math.random() * 37)
    const color = rouletteColor(number)
    const odd = number !== 0 && number % 2 === 1
    let won = false
    let odds = 2
    if (selection === 'red' || selection === 'black') {
      won = color === selection
    } else if (selection === 'odd') {
      won = odd
    } else if (selection === 'even') {
      won = number !== 0 && !odd
    } else if (selection?.startsWith('n-')) {
      const pick = Number(selection.slice(2))
      won = number === pick
      odds = 36
    } else {
      return { ok: false, error: 'Pick red, black, odd, even, or a number 0-36.' }
    }
    return instantGame({
      userId,
      game,
      selection,
      stake,
      odds,
      summary: `Ball on ${number} (${color}).`,
      won,
      extra: { number, color },
    })
  }

  if (game === 'slots') {
    const reels = [
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
    ]
    const [a, b, c] = reels
    let odds = 0
    let label = 'No win'
    if (a === 'seven' && b === 'seven' && c === 'seven') {
      odds = 20
      label = 'Triple seven'
    } else if (a === 'bar' && b === 'bar' && c === 'bar') {
      odds = 10
      label = 'Triple bar'
    } else if (a === 'wild' && b === 'wild' && c === 'wild') {
      odds = 15
      label = 'Triple wild'
    } else if (a === 'cherry' && b === 'cherry' && c === 'cherry') {
      odds = 5
      label = 'Triple cherry'
    } else if (reels.filter((item) => item === 'cherry').length >= 2) {
      odds = 2
      label = 'Two cherries'
    }
    return instantGame({
      userId,
      game,
      selection: 'spin',
      stake,
      odds: odds || 1.1,
      summary: `${reels.join(' · ')} — ${label}`,
      won: odds > 0,
      extra: { reels },
    })
  }

  if (game === 'blackjack') {
    if (action === 'deal') {
      if (getBlackjackHand(userId)) {
        return { ok: false, error: 'Finish the current blackjack hand first.' }
      }
      const preview = placeBet({
        userId,
        marketId: 'casino-blackjack',
        selectionId: 'hand',
        stake,
        oddsSeen: 2,
        label: { raceName: 'blackjack', runnerName: 'hand', game: 'blackjack' },
      })
      if (!preview.ok) {
        return preview
      }
      const deck = freshDeck()
      const player = [deck.pop(), deck.pop()]
      const dealer = [deck.pop(), deck.pop()]
      const hand = { betId: preview.data.id, stake: preview.data.stake, deck, player, dealer }
      if (handTotal(player) === 21) {
        return finishBlackjack(userId, hand)
      }
      setBlackjackHand(userId, hand)
      return {
        ok: true,
        data: {
          ...preview.data,
          summary: 'Your move. Hit or stand.',
          player: player.map(formatCard),
          dealer: [formatCard(dealer[0]), '??'],
          playerTotal: handTotal(player),
          stage: 'playing',
          balance: getBalance(userId),
        },
      }
    }
    const hand = getBlackjackHand(userId)
    if (!hand) {
      return { ok: false, error: 'Deal a blackjack hand first.' }
    }
    if (action === 'hit') {
      hand.player.push(hand.deck.pop())
      if (handTotal(hand.player) >= 21) {
        return finishBlackjack(userId, hand)
      }
      setBlackjackHand(userId, hand)
      return {
        ok: true,
        data: {
          summary: 'Your move. Hit or stand.',
          player: hand.player.map(formatCard),
          dealer: [formatCard(hand.dealer[0]), '??'],
          playerTotal: handTotal(hand.player),
          stage: 'playing',
          status: 'pending',
          balance: getBalance(userId),
        },
      }
    }
    if (action === 'stand') {
      return finishBlackjack(userId, hand)
    }
    return { ok: false, error: 'Unknown blackjack action.' }
  }

  if (game === 'poker') {
    if (action === 'deal') {
      if (getPokerHand(userId)) {
        return { ok: false, error: 'Finish the current poker hand first.' }
      }
      const preview = placeBet({
        userId,
        marketId: 'casino-poker',
        selectionId: 'hand',
        stake,
        oddsSeen: 2,
        label: { raceName: 'poker', runnerName: 'hand', game: 'poker' },
      })
      if (!preview.ok) {
        return preview
      }
      const deck = freshDeck()
      const cards = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()]
      setPokerHand(userId, {
        betId: preview.data.id,
        stake: preview.data.stake,
        deck,
        cards,
      })
      return {
        ok: true,
        data: {
          ...preview.data,
          summary: 'Hold cards, then draw.',
          cards: cards.map(formatCard),
          stage: 'hold',
          balance: getBalance(userId),
        },
      }
    }
    const hand = getPokerHand(userId)
    if (!hand) {
      return { ok: false, error: 'Deal a poker hand first.' }
    }
    const keep = Array.isArray(holds) ? holds : [true, true, true, true, true]
    const next = hand.cards.map((card, index) =>
      keep[index] ? card : hand.deck.pop(),
    )
    const ranked = pokerRank(next)
    const outcome = ranked.odds > 0 ? 'won' : 'lost'
    const odds = ranked.odds > 0 ? ranked.odds : 1.1
    const settled = settlePendingBet(hand.betId, outcome, odds)
    setPokerHand(userId, null)
    return decorate(
      settled,
      `${next.map(formatCard).join(' ')} — ${ranked.name}`,
      {
        cards: next.map(formatCard),
        stage: 'done',
        handName: ranked.name,
      },
    )
  }

  return { ok: false, error: 'Unknown casino game.' }
}
