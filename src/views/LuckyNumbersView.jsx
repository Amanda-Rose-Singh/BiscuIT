import { useAppStore } from '../store/useAppStore.js'

export function LuckyNumbersView() {
  const races = useAppStore((state) => state.races)
  const numbers = races.slice(0, 6).map((race, index) => {
    const n = String(race.id).replace(/\D/g, '')
    return ((Number(n) * 7 + index * 11) % 49) + 1
  })

  while (numbers.length < 6) {
    numbers.push(numbers.length * 8 + 3)
  }

  return (
    <section className="panel-card lucky-view" data-testid="lucky-numbers">
      <h1>Lucky Numbers</h1>
      <p className="muted">Simulated draw from today&apos;s card. Not a real lottery.</p>
      <ol className="lucky-balls">
        {numbers.map((value, index) => (
          <li key={`${value}-${index}`}>{value}</li>
        ))}
      </ol>
    </section>
  )
}
