const REGIONS = ['SA', 'UK', 'AU']
const DISTANCES = [1000, 1200, 1400, 1600, 2000, 2400]

function raceNumber(race) {
  const digits = String(race.id).replace(/\D/g, '')
  return Number(digits) || 1
}

export function raceRegion(race) {
  return REGIONS[(raceNumber(race) - 1) % REGIONS.length]
}

export function raceDistance(race) {
  return DISTANCES[(raceNumber(race) - 1) % DISTANCES.length]
}

export function runnerNumber(runner) {
  const parts = String(runner.id).split('-')
  return Number(parts[parts.length - 1]) || 1
}

export function runnerForm(runner) {
  const seed = String(runner.id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return [0, 1, 2, 3]
    .map((offset) => ((seed + offset * 7) % 9) + 1)
    .join('-')
}

export function formatPostClock(postTime) {
  const date = new Date(postTime)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const JOCKEYS = [
  'J. Snyman',
  'L. Fortune',
  'R. Padayachee',
  'M. Cheval',
  'S. Wright',
  'A. Nkosi',
  'C. Delport',
  'T. van Wyk',
  'K. Moodley',
  'P. Roux',
]

const SEX = ['g', 'f', 'c', 'm']

function runnerSeed(runner) {
  return String(runner.id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

export function runnerDraw(runner, fieldSize = 10) {
  const size = Math.max(fieldSize, 1)
  return (runnerSeed(runner) % size) + 1
}

export function runnerJockey(runner) {
  return JOCKEYS[runnerSeed(runner) % JOCKEYS.length]
}

export function runnerWas(runner) {
  const seed = runnerSeed(runner)
  const kg = 52 + (seed % 11)
  const age = 3 + (seed % 6)
  const sex = SEX[seed % SEX.length]
  return `${kg}kg / ${age}y / ${sex}`
}

export function openingOdds(runner) {
  const history = runner.oddsHistory || []
  const value = history[0] ?? runner.odds
  return Number(value)
}

export function previousOdds(runner) {
  const history = runner.oddsHistory || []
  if (history.length >= 2) {
    return Number(history[history.length - 2])
  }
  return Number(history[0] ?? runner.odds)
}

export function placeOdds(winOdds) {
  const fractional = Math.max(0, Number(winOdds) - 1)
  const place = 1 + fractional / 4
  return Math.max(1.1, Math.round(place * 100) / 100)
}

