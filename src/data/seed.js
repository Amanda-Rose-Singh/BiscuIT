const TRACKS = [
  'Meadowbrook Park',
  'Silver Creek Downs',
  'Harbor Lights',
  'Redstone Heath',
  'Willow Run',
  'Northcliff',
]

const RACE_NAMES = [
  'Opening Sprint',
  'Mile Handicap',
  'Coastal Stakes',
  'Twilight Cup',
  'Nursery Plate',
  'Feature Chase',
]

const HORSE_NAMES = [
  'Amber Dancer',
  'Blue Lantern',
  'Copper Wind',
  'Dusty Ledger',
  'Evening Bell',
  'Foxglove',
  'Golden Hearth',
  'Iron Orchard',
  'Juniper',
  'Keepsake',
  'Larkspur',
  'Maple Crown',
  'Night Harbor',
  'Olive Branch',
  'Pebble Shore',
  'Quiet Riot',
  'River Glass',
  'Stonebird',
  'Timberline',
  'Umber Sky',
  'Violet Hour',
  'Willow King',
  'Yellow Finch',
  'Zephyr Note',
]

const SILKS = [
  '#c0392b',
  '#2980b9',
  '#27ae60',
  '#8e44ad',
  '#d35400',
  '#16a085',
  '#2c3e50',
  '#f1c40f',
  '#e74c3c',
  '#1abc9c',
]

function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function randomOdds() {
  const raw = 1.2 + Math.random() * 11
  return Math.round(raw * 100) / 100
}

export function createSeedRaces(now = Date.now()) {
  const horsePool = shuffle(HORSE_NAMES)
  let horseIndex = 0
  const countdownSeconds = [32, 48, 75, 95, 120, 165]

  return RACE_NAMES.map((name, raceIndex) => {
    const runnerCount = 6 + (raceIndex % 5)
    const runners = Array.from({ length: runnerCount }, (_, runnerIndex) => {
      const odds = randomOdds()
      const runner = {
        id: `r${raceIndex + 1}-${runnerIndex + 1}`,
        name: horsePool[horseIndex % horsePool.length],
        silkColor: SILKS[runnerIndex % SILKS.length],
        odds,
        oddsHistory: [odds],
      }
      horseIndex += 1
      return runner
    })

    const secondsToPost = countdownSeconds[raceIndex]
    const postTime = now + secondsToPost * 1000
    const raceDurationMs = 10000 + Math.floor(Math.random() * 10000)

    return {
      id: `race-${raceIndex + 1}`,
      name,
      trackName: TRACKS[raceIndex],
      status: 'upcoming',
      postTime,
      raceDurationMs,
      winnerId: null,
      runners,
    }
  })
}

export const STARTING_BALANCE = 1000
