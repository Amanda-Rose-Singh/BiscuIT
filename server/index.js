import cors from 'cors'
import express from 'express'
import { playCasino } from './casino.js'
import { clearSettleTimer, lockRace, settleRace, startOddsEngine } from './oddsEngine.js'
import {
  consumeForceBetError,
  DEFAULT_USER_ID,
  deposit,
  getBalance,
  getBets,
  getDebug,
  getRace,
  getRaces,
  getStateSnapshot,
  getTransactions,
  MAX_SINGLE_STAKE,
  placeBet,
  setDebug,
  settleMarketAdmin,
  withdraw,
} from './store.js'

const PORT = Number(process.env.PORT) || 3001
const app = express()

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  }),
)
app.use(express.json())

app.use(async (_req, _res, next) => {
  const { delayMs } = getDebug()
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  next()
})

function sendResult(res, result, successStatus = 200) {
  if (!result.ok) {
    const status = result.error?.includes('not found') ? 404 : 400
    res.status(status).json({ ok: false, error: result.error })
    return
  }
  res.status(successStatus).json({ ok: true, data: result.data })
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/debug', (_req, res) => {
  res.json({ ok: true, data: { ...getDebug(), maxSingleStake: MAX_SINGLE_STAKE } })
})

app.post('/api/debug', (req, res) => {
  res.json({ ok: true, data: setDebug(req.body || {}) })
})

app.get('/api/races', (_req, res) => {
  res.json({ ok: true, data: getRaces() })
})

app.get('/api/races/:id', (req, res) => {
  const race = getRace(req.params.id)
  if (!race) {
    res.status(404).json({ ok: false, error: 'Race not found' })
    return
  }
  res.json({ ok: true, data: race })
})

app.get('/api/user/balance', (_req, res) => {
  res.json({ ok: true, data: { balance: getBalance(DEFAULT_USER_ID) } })
})

app.get('/api/state', (_req, res) => {
  res.json({ ok: true, data: getStateSnapshot(DEFAULT_USER_ID) })
})

app.post('/api/wallet/deposit', (req, res) => {
  sendResult(res, deposit(DEFAULT_USER_ID, req.body?.amount))
})

app.post('/api/wallet/withdraw', (req, res) => {
  sendResult(res, withdraw(DEFAULT_USER_ID, req.body?.amount))
})

app.get('/api/transactions', (_req, res) => {
  res.json({ ok: true, data: getTransactions(DEFAULT_USER_ID) })
})

app.get('/api/bets', (_req, res) => {
  res.json({ ok: true, data: getBets(DEFAULT_USER_ID) })
})

app.post('/api/bets', (req, res) => {
  if (consumeForceBetError()) {
    res.status(500).json({ ok: false, error: 'Forced bet placement failure.' })
    return
  }
  const body = req.body || {}
  sendResult(
    res,
    placeBet({
      userId: DEFAULT_USER_ID,
      marketId: body.marketId,
      selectionId: body.selectionId,
      stake: body.stake,
      oddsSeen: body.oddsSeen,
      market: body.market,
    }),
    201,
  )
})

app.post('/api/casino/play', (req, res) => {
  if (consumeForceBetError()) {
    res.status(500).json({ ok: false, error: 'Forced bet placement failure.' })
    return
  }
  const body = req.body || {}
  sendResult(
    res,
    playCasino({
      userId: DEFAULT_USER_ID,
      game: body.game,
      action: body.action,
      selection: body.selection,
      stake: body.stake,
      holds: body.holds,
    }),
  )
})

app.post('/api/admin/settle', (req, res) => {
  const { marketId, outcome } = req.body || {}
  const result = settleMarketAdmin(marketId, outcome)
  if (result.ok) {
    clearSettleTimer(marketId)
  }
  sendResult(res, result)
})

app.post('/api/admin/lock', (req, res) => {
  sendResult(res, lockRace(req.body?.marketId || req.body?.raceId))
})

app.post('/api/admin/settle-winner', (req, res) => {
  sendResult(res, settleRace(req.body?.marketId || req.body?.raceId))
})

app.listen(PORT, '127.0.0.1', () => {
  startOddsEngine()
  console.log(`BiscuIT API listening on http://127.0.0.1:${PORT}`)
})
