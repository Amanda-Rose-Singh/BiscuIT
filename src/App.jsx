import { useEffect } from 'react'
import { bindStoreToEngine, useAppStore } from './store/useAppStore.js'
import { AppHeader } from './components/AppHeader.jsx'
import { Betslip } from './components/Betslip.jsx'
import { RacesView } from './views/RacesView.jsx'
import { RaceDetailView } from './views/RaceDetailView.jsx'
import { BetHistoryView } from './views/BetHistoryView.jsx'
import { WalletView } from './views/WalletView.jsx'

export default function App() {
  const view = useAppStore((state) => state.view)
  const hydrate = useAppStore((state) => state.hydrate)

  useEffect(() => {
    bindStoreToEngine()
    hydrate()
  }, [hydrate])

  return (
    <div className="app-shell" data-testid="app-shell">
      <AppHeader />
      <div className="app-body">
        <main className="app-main" data-testid={`view-${view}`}>
          {view === 'races' && <RacesView />}
          {view === 'race-detail' && <RaceDetailView />}
          {view === 'history' && <BetHistoryView />}
          {view === 'wallet' && <WalletView />}
        </main>
        <Betslip />
      </div>
    </div>
  )
}
