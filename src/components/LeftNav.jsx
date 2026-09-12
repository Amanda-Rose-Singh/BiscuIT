import { useAppStore } from '../store/useAppStore.js'

const RACING = [
  { id: 'next', label: 'Next Races', view: 'races', testId: 'nav-races' },
  { id: 'sa', label: 'Horse Racing — SA', view: 'races', testId: 'nav-region-sa' },
  { id: 'uk', label: 'Horse Racing — UK', view: 'races', testId: 'nav-region-uk' },
  { id: 'au', label: 'Horse Racing — AU', view: 'races', testId: 'nav-region-au' },
  { id: 'results', label: 'Results', view: 'history', testId: 'nav-history' },
  { id: 'lucky', label: 'Lucky Numbers', view: 'lucky', testId: 'nav-lucky' },
]

const CASINO = [
  { id: 'casino', label: 'Lobby', view: 'casino', testId: 'nav-casino' },
  { id: 'dice', label: 'Dice', view: 'casino-dice', testId: 'nav-casino-dice' },
  { id: 'coinflip', label: 'Coinflip', view: 'casino-coinflip', testId: 'nav-casino-coinflip' },
  { id: 'roulette', label: 'Roulette', view: 'casino-roulette', testId: 'nav-casino-roulette' },
  { id: 'slots', label: 'Slots', view: 'casino-slots', testId: 'nav-casino-slots' },
  { id: 'blackjack', label: 'Blackjack', view: 'casino-blackjack', testId: 'nav-casino-blackjack' },
  { id: 'poker', label: 'Poker', view: 'casino-poker', testId: 'nav-casino-poker' },
]

export function LeftNav({ category, onCategory, onNavigate, onSelectView }) {
  const view = useAppStore((state) => state.view)
  const setView = useAppStore((state) => state.setView)

  const go = (nextView, racingId) => {
    if (racingId) {
      onCategory(racingId)
    }
    if (onSelectView) {
      onSelectView(nextView)
    } else {
      setView(nextView)
    }
    onNavigate?.()
  }

  const renderItems = (items, racing) =>
    items.map((item) => {
      const onRaces = view === 'races' || view === 'race-detail'
      const active = racing
        ? (item.view === 'races' && onRaces && category === item.id) ||
          (item.view !== 'races' && view === item.view)
        : view === item.view
      return (
        <button
          key={item.id}
          type="button"
          data-testid={item.testId}
          className={active ? 'is-active' : ''}
            onClick={() => go(item.view, racing ? item.id : null)}
        >
          {item.label}
        </button>
      )
    })

  return (
    <nav className="left-nav" data-testid="app-nav">
      <p className="nav-section-label">Racing</p>
      {renderItems(RACING, true)}
      <p className="nav-section-label">Casino</p>
      {renderItems(CASINO, false)}
      <p className="nav-section-label">Tools</p>
      <button
        type="button"
        data-testid="nav-admin"
        className={view === 'admin' ? 'is-active' : ''}
        onClick={() => go('admin')}
      >
        Admin
      </button>
    </nav>
  )
}
