import { useEffect, useState } from 'react'
import { bindStoreToEngine, useAppStore } from './store/useAppStore.js'
import { AppHeader } from './components/AppHeader.jsx'
import { LeftNav } from './components/LeftNav.jsx'
import { AccountWidget } from './components/AccountWidget.jsx'
import { Betslip } from './components/Betslip.jsx'
import { DebugPanel } from './components/DebugPanel.jsx'
import { BetErrorToast } from './components/BetErrorToast.jsx'
import { RacesView } from './views/RacesView.jsx'
import { RaceDetailView } from './views/RaceDetailView.jsx'
import { BetHistoryView } from './views/BetHistoryView.jsx'
import { WalletView } from './views/WalletView.jsx'
import { LuckyNumbersView } from './views/LuckyNumbersView.jsx'
import { AdminView } from './views/AdminView.jsx'
import { CasinoView } from './views/CasinoView.jsx'
import { AuthModal } from './components/AuthModal.jsx'

const REGION_BY_CATEGORY = {
  sa: 'SA',
  uk: 'UK',
  au: 'AU',
}

function pathView() {
  const path = window.location.pathname.replace(/\/$/, '')
  if (path.endsWith('/admin')) {
    return 'admin'
  }
  return null
}

function debugEnabled() {
  return new URLSearchParams(window.location.search).get('debug') === 'true'
}

export default function App() {
  const view = useAppStore((state) => state.view)
  const hydrate = useAppStore((state) => state.hydrate)
  const setView = useAppStore((state) => state.setView)
  const [category, setCategory] = useState('next')
  const [navOpen, setNavOpen] = useState(false)
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [slipOpen, setSlipOpen] = useState(false)
  const [authMode, setAuthMode] = useState(null)
  const [showDebug, setShowDebug] = useState(debugEnabled())

  useEffect(() => {
    bindStoreToEngine()
    hydrate()
    const fromPath = pathView()
    if (fromPath) {
      setView(fromPath)
    }
  }, [hydrate, setView])

  useEffect(() => {
    const onPop = () => {
      setShowDebug(debugEnabled())
      const fromPath = pathView()
      if (fromPath) {
        setView(fromPath)
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [setView])

  const closeDrawers = () => {
    setNavOpen(false)
    setSlipOpen(false)
  }

  const openAdmin = () => {
    const search = window.location.search
    window.history.pushState({}, '', `${import.meta.env.BASE_URL}admin${search}`.replace(/\/{2,}admin/, '/admin'))
    setView('admin')
    closeDrawers()
  }

  const selectView = (next) => {
    if (next === 'admin') {
      openAdmin()
      return
    }
    if (window.location.pathname.endsWith('/admin')) {
      window.history.pushState(
        {},
        '',
        `${import.meta.env.BASE_URL}${window.location.search}`.replace(/\/{2,}/g, '/'),
      )
    }
    setView(next)
    closeDrawers()
  }

  return (
    <div className="app-shell" data-testid="app-shell">
      <AppHeader
        onToggleNav={() => {
          if (window.matchMedia('(max-width: 960px)').matches) {
            setNavOpen((open) => !open)
            setSlipOpen(false)
            return
          }
          setNavCollapsed((collapsed) => !collapsed)
        }}
        onToggleSlip={() => {
          setSlipOpen((open) => !open)
          setNavOpen(false)
        }}
        onLogin={() => setAuthMode('login')}
        onJoin={() => setAuthMode('join')}
      />
      <div
        className={
          navCollapsed ? 'app-body nav-collapsed' : 'app-body'
        }
      >
        <div className={navOpen ? 'left-rail is-open' : 'left-rail'}>
          <LeftNav
            category={category}
            onCategory={setCategory}
            onNavigate={closeDrawers}
            onSelectView={selectView}
          />
          <AccountWidget onNavigate={closeDrawers} />
        </div>
        {(navOpen || slipOpen) && (
          <button
            type="button"
            className="drawer-scrim mobile-only"
            aria-label="Close panels"
            onClick={closeDrawers}
          />
        )}
        <main className="app-main" data-testid={`view-${view}`}>
          {view === 'races' && (
            <RacesView region={REGION_BY_CATEGORY[category] ?? null} />
          )}
          {view === 'race-detail' && <RaceDetailView />}
          {view === 'history' && <BetHistoryView />}
          {view === 'wallet' && <WalletView />}
          {view === 'lucky' && <LuckyNumbersView />}
          {view === 'admin' && <AdminView />}
          {String(view).startsWith('casino') && <CasinoView view={view} />}
        </main>
        <Betslip mobileOpen={slipOpen} onClose={() => setSlipOpen(false)} />
      </div>
      <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />
      <BetErrorToast />
      {showDebug && <DebugPanel />}
      <nav className="mobile-dock mobile-only" data-testid="mobile-dock">
        <button type="button" onClick={() => setNavOpen(true)}>
          Menu
        </button>
        <button
          type="button"
          onClick={() => {
            setCategory('next')
            setView('races')
            closeDrawers()
          }}
        >
          Races
        </button>
        <button type="button" onClick={() => setSlipOpen(true)}>
          Slip
        </button>
        <button
          type="button"
          onClick={() => {
            setView('wallet')
            closeDrawers()
          }}
        >
          Account
        </button>
      </nav>
    </div>
  )
}
