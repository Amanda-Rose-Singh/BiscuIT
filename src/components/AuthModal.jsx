export function AuthModal({ mode, onClose }) {
  if (!mode) {
    return null
  }

  const title = mode === 'join' ? 'Join Lucky Day Racing' : 'Log in'
  const action = mode === 'join' ? 'Create account' : 'Log in'

  return (
    <div className="auth-scrim" data-testid="auth-modal">
      <div className="auth-card" role="dialog" aria-labelledby="auth-title">
        <h2 id="auth-title">{title}</h2>
        <p className="muted">
          Simulated sportsbook. No real account is created and no details are
          sent anywhere.
        </p>
        <label className="auth-label">
          Email
          <input type="email" autoComplete="off" placeholder="you@example.com" />
        </label>
        <label className="auth-label">
          Password
          <input type="password" autoComplete="off" placeholder="••••••••" />
        </label>
        <button type="button" className="auth-join" onClick={onClose}>
          {action}
        </button>
        <button type="button" className="text-button" data-testid="auth-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
