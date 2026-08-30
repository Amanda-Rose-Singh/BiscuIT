import { useEffect, useState } from 'react'

function formatRemaining(ms) {
  if (ms <= 0) {
    return '0:00'
  }
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function Countdown({ raceId, postTime, status }) {
  const [label, setLabel] = useState(() => formatRemaining(postTime - Date.now()))

  useEffect(() => {
    if (status !== 'upcoming') {
      setLabel('0:00')
      return undefined
    }
    const tick = () => setLabel(formatRemaining(postTime - Date.now()))
    tick()
    const timer = window.setInterval(tick, 250)
    return () => window.clearInterval(timer)
  }, [postTime, status])

  return (
    <span data-testid={`countdown-${raceId}`} className="countdown">
      {status === 'upcoming' ? label : 'Off'}
    </span>
  )
}
