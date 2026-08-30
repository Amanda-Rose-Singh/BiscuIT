const TRACKS = [
  'Meadowbrook Park',
  'Silver Creek Downs',
  'Harbor Lights',
  'Redstone Heath',
  'Willow Run',
  'Northcliff',
  'Kenilworth',
  'Turffontein',
  'Greyville',
  'Newmarket',
  'Ascot',
  'Flemington',
  'Randwick',
]

const RACE_NAMES = [
  'Opening Sprint',
  'Mile Handicap',
  'Coastal Stakes',
  'Twilight Cup',
  'Nursery Plate',
  'Feature Chase',
  'Maiden Plate',
  'Fillies Guineas',
  'Progression Handicap',
  'Metropolitan Mile',
  'Night Cap',
  'River Plate',
  'Highveld Sprint',
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
  'Ashen Mare',
  'Bold Current',
  'Cedar Flame',
  'Driftwood',
  'Ember Trail',
  'Frost Line',
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

function nudge(odds, amount) {
  const next = Math.min(25, Math.max(1.1, odds + amount))
  return Math.round(next * 100) / 100
}

function buildRunners(raceIndex, count, horsePool, horseIndex, withHistory) {
  const runners = Array.from({ length: count }, (_, runnerIndex) => {
    const opening = randomOdds()
    const previous = nudge(opening, (Math.random() - 0.5) * 0.8)
    const current = withHistory
      ? nudge(previous, (Math.random() - 0.5) * 0.6)
      : opening
    return {
      id: `r${raceIndex + 1}-${runnerIndex + 1}`,
      name: horsePool[(horseIndex + runnerIndex) % horsePool.length],
      silkColor: SILKS[runnerIndex % SILKS.length],
      odds: current,
      oddsHistory: withHistory ? [opening, previous, current] : [opening],
    }
  })
  return { runners, nextHorseIndex: horseIndex + count }
}

function buildRace({
  raceIndex,
  name,
  trackName,
  now,
  status,
  secondsFromNow,
  raceDurationMs,
  horsePool,
  horseIndex,
}) {
  const runnerCount = 6 + (raceIndex % 5)
  const { runners, nextHorseIndex } = buildRunners(
    raceIndex,
    runnerCount,
    horsePool,
    horseIndex,
    status !== 'upcoming',
  )

  return {
    race: {
      id: `race-${raceIndex + 1}`,
      name,
      trackName,
      status,
      postTime: now + secondsFromNow * 1000,
      raceDurationMs,
      winnerId: null,
      runners,
    },
    nextHorseIndex,
  }
}

export function createSeedRaces(now = Date.now()) {
  const horsePool = shuffle(HORSE_NAMES)
  let horseIndex = 0
  const races = []

  const upcomingOffsets = [42, 58, 74, 95, 118, 140, 165, 190, 220, 255]
  upcomingOffsets.forEach((secondsToPost, index) => {
    const { race, nextHorseIndex } = buildRace({
      raceIndex: index,
      name: RACE_NAMES[index],
      trackName: TRACKS[index % TRACKS.length],
      now,
      status: 'upcoming',
      secondsFromNow: secondsToPost,
      raceDurationMs: 10000 + Math.floor(Math.random() * 10000),
      horsePool,
      horseIndex,
    })
    horseIndex = nextHorseIndex
    races.push(race)
  })

  const liveSpecs = [
    { name: 'Kenilworth Dash', trackName: 'Kenilworth', elapsed: -28, remainingMs: 38000 },
    { name: 'Turf Mile Live', trackName: 'Turffontein', elapsed: -45, remainingMs: 28000 },
    { name: 'Greyville On Air', trackName: 'Greyville', elapsed: -18, remainingMs: 42000 },
  ]

  liveSpecs.forEach((spec, liveIndex) => {
    const raceIndex = upcomingOffsets.length + liveIndex
    const { race, nextHorseIndex } = buildRace({
      raceIndex,
      name: spec.name,
      trackName: spec.trackName,
      now,
      status: 'in-progress',
      secondsFromNow: spec.elapsed,
      raceDurationMs: spec.remainingMs,
      horsePool,
      horseIndex,
    })
    horseIndex = nextHorseIndex
    races.push(race)
  })

  return races
}

export const STARTING_BALANCE = 1000
