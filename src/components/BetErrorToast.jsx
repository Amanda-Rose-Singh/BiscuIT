import { useAppStore } from '../store/useAppStore.js'

export function BetErrorToast() {
  const toastMessage = useAppStore((state) => state.toastMessage)
  const dismissToast = useAppStore((state) => state.dismissToast)
  if (!toastMessage) {
    return null
  }
  return (
    <div className="bet-toast" data-testid="bet-error-toast" role="alert">
      <span>{toastMessage}</span>
      <button type="button" onClick={dismissToast}>
        Dismiss
      </button>
    </div>
  )
}
