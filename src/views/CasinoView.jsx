import { useState } from 'react'
import { StakeField, usePlayableStake } from '../components/StakeField.jsx'
import { useAppStore } from '../store/useAppStore.js'

function GameFrame({ game, title, children, payout }) {
  return (
    <section className="panel-card casino-game" data-testid={`casino-${game}-root`}>
      <h1>{title}</h1>
      {payout && <p className="muted">{payout}</p>}
      {children}
    </section>
  )
}

function Result({ game, text, status }) {
  if (!text) {
    return null
  }
  return (
    <p className="casino-result" data-testid={`casino-${game}-result`} data-status={status}>
      {text}
    </p>
  )
}

export function CasinoHubView({ onOpen }) {
  const games = [
    ['dice', 'Dice'],
    ['coinflip', 'Coinflip'],
    ['roulette', 'Roulette'],
    ['slots', 'Slots'],
    ['blackjack', 'Blackjack'],
    ['poker', 'Video poker'],
  ]
  return (
    <section className="panel-card" data-testid="casino-hub">
      <h1>Casino</h1>
      <p className="muted">Same wallet as racing. Instant settle except blackjack/poker hands.</p>
      <div className="casino-grid">
        {games.map(([id, label]) => (
          <button key={id} type="button" onClick={() => onOpen(`casino-${id}`)}>
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}

export function DiceGame() {
  const { stake, setStake, parsed } = usePlayableStake()
  const runCasino = useAppStore((state) => state.runCasino)
  const placing = useAppStore((state) => state.placing)
  const [selection, setSelection] = useState('n-6')
  const [result, setResult] = useState('')
  const [status, setStatus] = useState('')

  return (
    <GameFrame game="dice" title="Dice" payout="Single number 5.00 · Over/Under 2.50">
      <div className="chip-row">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            type="button"
            className={selection === `n-${n}` ? 'is-active' : ''}
            onClick={() => setSelection(`n-${n}`)}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          className={selection === 'over' ? 'is-active' : ''}
          onClick={() => setSelection('over')}
        >
          Over 4.5
        </button>
        <button
          type="button"
          className={selection === 'under' ? 'is-active' : ''}
          onClick={() => setSelection('under')}
        >
          Under 2.5
        </button>
      </div>
      <StakeField testId="casino-dice-bet-input" value={stake} onChange={setStake} disabled={placing} />
      <button
        type="button"
        data-testid="casino-dice-play-button"
        disabled={placing || !parsed.ok}
        onClick={async () => {
          const response = await runCasino({ game: 'dice', selection, stake: parsed.value })
          if (response.ok) {
            setResult(response.data.summary)
            setStatus(response.data.status)
          } else if (!response.status || response.status !== 500) {
            setResult(response.error)
            setStatus('error')
          }
        }}
      >
        {placing ? 'Rolling…' : 'Roll'}
      </button>
      <Result game="dice" text={result} status={status} />
    </GameFrame>
  )
}

export function CoinflipGame() {
  const { stake, setStake, parsed } = usePlayableStake()
  const runCasino = useAppStore((state) => state.runCasino)
  const placing = useAppStore((state) => state.placing)
  const [selection, setSelection] = useState('heads')
  const [result, setResult] = useState('')
  const [status, setStatus] = useState('')

  return (
    <GameFrame game="coinflip" title="Coinflip" payout="Even money 2.00">
      <div className="chip-row">
        {['heads', 'tails'].map((side) => (
          <button
            key={side}
            type="button"
            className={selection === side ? 'is-active' : ''}
            onClick={() => setSelection(side)}
          >
            {side}
          </button>
        ))}
      </div>
      <StakeField testId="casino-coinflip-bet-input" value={stake} onChange={setStake} disabled={placing} />
      <button
        type="button"
        data-testid="casino-coinflip-play-button"
        disabled={placing || !parsed.ok}
        onClick={async () => {
          const response = await runCasino({
            game: 'coinflip',
            selection,
            stake: parsed.value,
          })
          if (response.ok) {
            setResult(response.data.summary)
            setStatus(response.data.status)
          }
        }}
      >
        {placing ? 'Flipping…' : 'Flip'}
      </button>
      <Result game="coinflip" text={result} status={status} />
    </GameFrame>
  )
}

export function RouletteGame() {
  const { stake, setStake, parsed } = usePlayableStake()
  const runCasino = useAppStore((state) => state.runCasino)
  const placing = useAppStore((state) => state.placing)
  const [selection, setSelection] = useState('red')
  const [number, setNumber] = useState('17')
  const [result, setResult] = useState('')
  const [status, setStatus] = useState('')

  return (
    <GameFrame
      game="roulette"
      title="Roulette"
      payout="Red/black/odd/even 2.00 · single number 36.00 · 0-36"
    >
      <div className="chip-row">
        {['red', 'black', 'odd', 'even'].map((item) => (
          <button
            key={item}
            type="button"
            className={selection === item ? 'is-active' : ''}
            onClick={() => setSelection(item)}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          className={selection.startsWith('n-') ? 'is-active' : ''}
          onClick={() => setSelection(`n-${number}`)}
        >
          Number
        </button>
        <input
          type="number"
          min="0"
          max="36"
          value={number}
          onChange={(event) => {
            setNumber(event.target.value)
            setSelection(`n-${event.target.value}`)
          }}
        />
      </div>
      <StakeField testId="casino-roulette-bet-input" value={stake} onChange={setStake} disabled={placing} />
      <button
        type="button"
        data-testid="casino-roulette-play-button"
        disabled={placing || !parsed.ok}
        onClick={async () => {
          const response = await runCasino({
            game: 'roulette',
            selection,
            stake: parsed.value,
          })
          if (response.ok) {
            setResult(response.data.summary)
            setStatus(response.data.status)
          }
        }}
      >
        {placing ? 'Spinning…' : 'Spin'}
      </button>
      <Result game="roulette" text={result} status={status} />
    </GameFrame>
  )
}

export function SlotsGame() {
  const { stake, setStake, parsed } = usePlayableStake()
  const runCasino = useAppStore((state) => state.runCasino)
  const placing = useAppStore((state) => state.placing)
  const [reels, setReels] = useState(['?', '?', '?'])
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState('')
  const [status, setStatus] = useState('')

  return (
    <GameFrame
      game="slots"
      title="Slots"
      payout="3 reel: 7s 20x · wilds 15x · bars 10x · cherries 5x · two cherries 2x"
    >
      <div className="slot-reels" data-testid="casino-slots-reels" data-spinning={spinning}>
        {reels.map((symbol, index) => (
          <span key={index} className={spinning ? 'is-spinning' : ''}>
            {symbol}
          </span>
        ))}
      </div>
      <StakeField testId="casino-slots-bet-input" value={stake} onChange={setStake} disabled={placing || spinning} />
      <button
        type="button"
        data-testid="casino-slots-play-button"
        disabled={placing || spinning || !parsed.ok}
        onClick={async () => {
          setSpinning(true)
          setStatus('in-progress')
          setResult('Reels spinning…')
          const response = await runCasino({ game: 'slots', stake: parsed.value })
          await new Promise((resolve) => setTimeout(resolve, 1400))
          setSpinning(false)
          if (response.ok) {
            setReels(response.data.reels)
            setResult(response.data.summary)
            setStatus(response.data.status)
          } else {
            setResult(response.error)
            setStatus('error')
          }
        }}
      >
        {spinning ? 'Spinning…' : 'Spin'}
      </button>
      <Result game="slots" text={result} status={status} />
    </GameFrame>
  )
}

export function BlackjackGame() {
  const { stake, setStake, parsed } = usePlayableStake()
  const runCasino = useAppStore((state) => state.runCasino)
  const placing = useAppStore((state) => state.placing)
  const [hand, setHand] = useState(null)

  const apply = (response) => {
    if (response.ok) {
      setHand(response.data)
    }
  }

  return (
    <GameFrame game="blackjack" title="Blackjack" payout="Win 2.00 · blackjack 2.50 · push refunds stake">
      <StakeField
        testId="casino-blackjack-bet-input"
        value={stake}
        onChange={setStake}
        disabled={placing || hand?.stage === 'playing'}
      />
      <button
        type="button"
        data-testid="casino-blackjack-play-button"
        disabled={placing || !parsed.ok || hand?.stage === 'playing'}
        onClick={async () => {
          apply(
            await runCasino({
              game: 'blackjack',
              action: 'deal',
              stake: parsed.value,
            }),
          )
        }}
      >
        Deal
      </button>
      {hand?.stage === 'playing' && (
        <div className="chip-row">
          <button
            type="button"
            disabled={placing}
            onClick={async () => apply(await runCasino({ game: 'blackjack', action: 'hit' }))}
          >
            Hit
          </button>
          <button
            type="button"
            disabled={placing}
            onClick={async () => apply(await runCasino({ game: 'blackjack', action: 'stand' }))}
          >
            Stand
          </button>
        </div>
      )}
      {hand && (
        <Result
          game="blackjack"
          text={`${hand.summary} You: ${(hand.player || []).join(' ')} Dealer: ${(hand.dealer || []).join(' ')}`}
          status={hand.stage === 'playing' ? 'in-progress' : hand.status}
        />
      )}
    </GameFrame>
  )
}

export function PokerGame() {
  const { stake, setStake, parsed } = usePlayableStake()
  const runCasino = useAppStore((state) => state.runCasino)
  const placing = useAppStore((state) => state.placing)
  const [hand, setHand] = useState(null)
  const [holds, setHolds] = useState([true, true, true, true, true])

  return (
    <GameFrame
      game="poker"
      title="Video poker"
      payout="Jacks or better table: pair 2x · two pair 2x · trips 3x · straight 4x · flush 6x · boat 9x · quads 25x · straight flush 50x · royal 800x"
    >
      <StakeField
        testId="casino-poker-bet-input"
        value={stake}
        onChange={setStake}
        disabled={placing || hand?.stage === 'hold'}
      />
      <button
        type="button"
        data-testid="casino-poker-play-button"
        disabled={placing || !parsed.ok || hand?.stage === 'hold'}
        onClick={async () => {
          const response = await runCasino({
            game: 'poker',
            action: 'deal',
            stake: parsed.value,
          })
          if (response.ok) {
            setHand(response.data)
            setHolds([true, true, true, true, true])
          }
        }}
      >
        Deal
      </button>
      {hand?.cards && (
        <div className="chip-row">
          {hand.cards.map((card, index) => (
            <button
              key={`${card}-${index}`}
              type="button"
              className={holds[index] ? 'is-active' : ''}
              disabled={hand.stage !== 'hold'}
              onClick={() =>
                setHolds((current) =>
                  current.map((keep, keepIndex) =>
                    keepIndex === index ? !keep : keep,
                  ),
                )
              }
            >
              {card}
              {hand.stage === 'hold' ? (holds[index] ? ' HOLD' : ' DRAW') : ''}
            </button>
          ))}
        </div>
      )}
      {hand?.stage === 'hold' && (
        <button
          type="button"
          disabled={placing}
          onClick={async () => {
            const response = await runCasino({
              game: 'poker',
              action: 'draw',
              holds,
            })
            if (response.ok) {
              setHand(response.data)
            }
          }}
        >
          Draw
        </button>
      )}
      {hand?.summary && (
        <Result
          game="poker"
          text={hand.summary}
          status={hand.stage === 'hold' ? 'in-progress' : hand.status}
        />
      )}
    </GameFrame>
  )
}

export function CasinoView({ view }) {
  const setView = useAppStore((state) => state.setView)
  if (view === 'casino-dice') return <DiceGame />
  if (view === 'casino-coinflip') return <CoinflipGame />
  if (view === 'casino-roulette') return <RouletteGame />
  if (view === 'casino-slots') return <SlotsGame />
  if (view === 'casino-blackjack') return <BlackjackGame />
  if (view === 'casino-poker') return <PokerGame />
  return <CasinoHubView onOpen={setView} />
}
