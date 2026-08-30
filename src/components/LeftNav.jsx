import { useAppStore } from '../store/useAppStore.js'

const ITEMS = [
  { id: 'next', label: 'Next Races', view: 'races', testId: 'nav-races' },
  { id: 'sa', label: 'Horse Racing — SA', view: 'races', testId: 'nav-region-sa' },
  { id: 'uk', label: 'Horse Racing — UK', view: 'races', testId: 'nav-region-uk' },
  { id: 'au', label: 'Horse Racing — AU', view: 'races', testId: 'nav-region-au' },
  { id: 'results', label: 'Results', view: 'history', testId: 'nav-history' },
  { id: 'lucky', label: 'Lucky Numbers', view: 'lucky', testId: 'nav-lucky' },
]

export function LeftNav({ category, onCategory, onNavigate }) {
  const view = useAppStore((state) => state.view)
  const setView = useAppStore((state) => state.setView)

  return (
    <nav className="left-nav" data-testid="app-nav">
      <p className="nav-section-label">Racing</p>
      {ITEMS.map((item) => {
        const onRaces = view === 'races' || view === 'race-detail'
        const active =
          (item.view === 'races' && onRaces && category === item.id) ||
          (item.view !== 'races' && view === item.view)
        return (
          <button
            key={item.id}
            type="button"
            data-testid={item.testId}
            className={active ? 'is-active' : ''}
            onClick={() => {
              onCategory(item.id)
              setView(item.view)
              onNavigate?.()
            }}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
