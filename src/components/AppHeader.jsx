export function AppHeader({ onToggleNav, onToggleSlip, onLogin, onJoin }) {
  return (
    <header className="app-header" data-testid="app-header">
      <div className="header-side header-left">
        <button
          type="button"
          className="icon-button hamburger-button"
          data-testid="toggle-left-nav"
          aria-label="Toggle navigation menu"
          onClick={onToggleNav}
        >
          ☰
        </button>
      </div>
      <div className="brand">
        <strong>Lucky Day Racing</strong>
        <span>BISCUIT</span>
      </div>
      <div className="header-side header-right">
        <button
          type="button"
          className="auth-login"
          data-testid="nav-login"
          onClick={onLogin}
        >
          Log In
        </button>
        <button
          type="button"
          className="auth-join"
          data-testid="nav-join"
          onClick={onJoin}
        >
          Join
        </button>
        <button
          type="button"
          className="icon-button mobile-only"
          data-testid="toggle-betslip"
          aria-label="Open betslip"
          onClick={onToggleSlip}
        >
          Slip
        </button>
      </div>
    </header>
  )
}
