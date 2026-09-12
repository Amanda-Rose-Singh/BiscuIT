# BiscuIT — Horse Racing Sportsbook + Casino (with local backend)

React + Vite client with a Node/Express backend. No real money, auth, or third-party odds feeds. The server holds the source of truth (in-memory store). Refreshing the browser must not reset wallet, pending bets, or history; restarting the Node process may.

This document supersedes the previous front-end-only spec. Existing racing UI, betslip, odds display, and Zustand store stay; the mock in-browser “backend” is replaced by HTTP.

## 1. Purpose

Provide a stable, testable sportsbook + casino UI so Playwright can exercise:

- Loading, validation, and error paths
- Live racing markets and betslip
- Wallet, ledger, and settlement
- Instant casino games
- Admin-driven market settlement
- Debug delay / forced API errors

## 2. Out of scope

- Real databases, real payments, real identity
- Production-grade admin auth (Admin is a visible testing tool)
- Full roulette table, multiplayer poker, or multi-hand blackjack
- Duplicating server state in `localStorage`
- Rewriting working racing list / betslip / odds UI except where an API contract change forces a thin adapter

**Hosting note:** `gh-pages` cannot run Express. The GitHub Pages build remains client-only and will fail API calls unless a backend is hosted separately. Local `npm run dev` is the supported full-stack path.

## 3. Tech constraints

| Area | Choice |
|------|--------|
| Client | Existing React + Vite app in `src/` (not renamed to `/client`) |
| Server | Express in `/server`, port **3001** |
| CORS | Allow Vite origin `http://localhost:5173` |
| Styling | Plain CSS, simple DOM |
| Client state | Zustand (existing store) |
| Persistence | Server in-memory only; client hydrates via `fetch` on load |
| Dev start | `npm run dev` runs **client + server** (`concurrently`) |
| Vite proxy | Optional `/api` proxy to `3001` so the client can call `/api/...` without CORS pain; CORS still enabled |

Every interactive control and key state container MUST have a stable `data-testid` (see §12).

## 4. Architecture

```
React UI  →  src/api/mockApi.js (same function names)  →  fetch('/api/...')  →  Express
                                                                      ↓
                                                         server/store (getBalance, placeBet, …)
                                                                      ↓
                                                         odds engine (server timers)
```

- **Do not** scatter raw array/object mutation in route handlers. Data access lives behind functions such as `getBalance(userId)`, `placeBet(...)`, `appendLedger(...)`, `settleMarket(...)`.
- Single default user for the portfolio: `userId = "default"` (no login required). Cosmetic Log In / Join modal stays as-is.
- Client modules that already call `getRaces()`, `getWallet()`, `getBets()`, `placeBet()` should keep those call sites. Only the internals of the API module change.
- `subscribeToOdds` currently uses in-process listeners. After the split, it **polls** `GET /api/races` (and wallet/bets as needed) on a short interval so live odds still update. No `localStorage`.

### 4.1 Known conflicts with the current app (do not ignore)

| Existing behavior | New requirement | Resolution |
|-------------------|-----------------|------------|
| `src/api/serverState.js` + `mockApi.js` are the backend | Real Express API | Move store + seed + settlement into `/server`. Keep `src/api/mockApi.js` as the HTTP adapter. |
| Odds engine runs in the browser (`window.setTimeout`, mutates `serverState`) | Server is source of truth | **Move the odds engine to the server.** Keep `window.__ODDS_ENGINE__` as a thin client helper that reads/triggers via API (lock/settle still useful for tests). |
| `placeBet()` does not debit; store then calls `applyWalletDebit()` | `POST /api/bets` debits immediately | Debit **once** inside `placeBet` on the server. Adapter `placeBet()` must not cause a second debit. Remove or no-op `applyWalletDebit` after a successful place. |
| `placeBet()` ~5% random reject | Part 7 one-shot 500 toggle | Drop random 5% rejection. Failures are validation, insufficient funds, closed market, or the debug one-shot 500. |
| Refresh resets all state | Part 6 persist via backend | Client already `hydrate()`s; after the split that hydrate hits the server. Wallet copy must not say refresh resets. |
| Race auto-settle picks one winner after 10–20s | Admin `won` / `lost` / `push` for **all** pending bets on a market | **Keep** automatic racing lifecycle (random winner → won/lost per selection). **Add** admin settle as an override for that `marketId`: all *pending* bets get the same outcome. Already-settled market → reject, no double-payout. |
| Bet payload `{ raceId, runnerId, stake, odds }` | `{ marketId, selectionId, stake, oddsSeen }` | HTTP body uses the new names. Client `placeBet({ raceId, runnerId, ... })` maps `raceId → marketId`, `runnerId → selectionId`, `odds → oddsSeen`. |
| No URL router; views are Zustand `view` | `/admin` route and `?debug=true` | Keep the view switch for racing/casino/wallet. Add a **light pathname check** for `/admin` (with Vite base `/BiscuIT/admin`). Debug panel when `debug=true` query param is present. Do not add a heavy router unless needed. |
| Wallet “Deposit” only opens Account | Real deposit / withdraw | Wire `nav-deposit` / wallet view to real modals and `POST /api/wallet/*`. |
| Lucky Numbers is a display-only view | Casino games | Keep Lucky Numbers. Add a **Casino** nav section with six games. |
| Seed ~13 races (10 upcoming + 3 live) | 15–20 concurrent markets | Expand seed only; same odds-engine pattern. |
| Bet status `pending` \| `won` \| `lost` | Add `push` | Extend status; history UI must show `push`. |
| Spec said “no tests in this repo” | Playwright already lives in `tests/` | Leave tests in-repo; they are not the product. |

## 5. Domain model

### 5.1 User / wallet

- Starting balance: **1000** credits (server seed, once per process)
- Plain number in the DOM (`wallet-balance`)
- Debit on successful bet placement; credit on win or push
- Deposit adds credits; withdraw subtracts (reject if amount > balance)

### 5.2 Market

Unified concept for racing and casino:

- `id` (e.g. `race-1`, `casino-dice` is a *game type*; each racing event is a market)
- Racing markets keep today’s race fields: `name`, `trackName`, runners, `status`, `postTime`, `raceDurationMs`, `winnerId`
- Casino rounds are short-lived markets created at play time, or a stable game market id plus a round id — pick one in implementation and keep ids stable in the UI (`data-testid` roots are per game, not per round)

Racing `status`: `upcoming` \| `in-progress` \| `closed` \| `settled`

### 5.3 Selection

- Racing: a runner (`id`, `name`, silk, decimal odds, `oddsHistory`)
- Casino: the player’s choice (dice number, heads, red, etc.)

### 5.4 Bet

- `id`, `marketId`, `selectionId`, `stake`, `odds` (odds seen / used), `potentialPayout`
- Display fields as needed (`raceName`, `runnerName`, `game`)
- `status`: `pending` \| `won` \| `lost` \| `push`
- `settledPayout` when resolved (`0` for lost; `stake * odds` for won; `stake` for push)

### 5.5 Ledger entry (new)

- `id`, `type`: `deposit` \| `withdrawal` \| `bet-debit` \| `bet-credit`
- `amount` (positive number; type indicates direction)
- `timestamp` (ISO or epoch ms)
- `runningBalance`
- Optional `betId` / `marketId` / `note`

### 5.6 Betslip leg (client)

Unchanged: race, runner, odds at add, editable stake, remove / clear.

### 5.7 Stake limits (new)

| Rule | Client | Server |
|------|--------|--------|
| Negative | Visible error `stake-validation-error` | HTTP 400 |
| Non-numeric | Same | HTTP 400 |
| Zero | Same | HTTP 400 |
| Exceeds wallet | Same | HTTP 400 insufficient funds |
| Exceeds max single bet | Same | HTTP 400 |

**Max single-bet limit: 5000.** Expose as `data-max-stake="5000"` on stake inputs (betslip and casino) and as `MAX_SINGLE_STAKE` in a shared/documented constant (client + server must match).

## 6. Views / navigation

Keep the shell: header, left nav, persistent betslip, mobile dock.

1. **Races** — list (status, countdown, region filters) — existing
2. **Race detail** — runners, live odds — existing
3. **Bet history** — placed bets including `push` — existing, extended
4. **Wallet** — balance, **deposit/withdraw**, **transaction ledger**
5. **Lucky Numbers** — existing display-only
6. **Casino** — hub + six games (new)
7. **Admin** — settle panel (new), via nav link **and** `/admin` path

Betslip remains persistent on racing views. Casino games have their own stake + play controls and still use the same wallet.

## 7. Odds engine (racing, now server-side)

Same rules as today, more concurrent markets:

- **15–20** active racing markets across SA / UK / AU meetings
- Upcoming: every **2–4s**, nudge decimal odds (floor **1.10**)
- Post time → `in-progress`, odds freeze, no new racing legs
- After simulated duration **10–20s** → `closed` then `settled`; one random winner; pending racing bets resolve won/lost; wallet credited on wins; ledger `bet-credit` on wins
- Inspectability: `window.__ODDS_ENGINE__` remains for tests, backed by server reads / admin helpers (`lockRace`, `settleRace` may call admin/debug endpoints)

## 8. Betslip behavior (racing)

Unchanged UX:

- Click upcoming odds to add a leg
- Totals: total stake, potential payout
- Place Bet: stake rules in §5.7, wallet check, odds-moved warning + explicit confirm, reject locked races
- **Place Bet button `disabled` (non-clickable) while a place request is in flight** (`placing === true`)
- Failures: inline `betslip-error` and, for request-level failures (500 / network), dismissible `bet-error-toast`
- No silent no-ops

## 9. HTTP API

Base: `http://localhost:3001` (or same-origin `/api` via Vite proxy). JSON.

| Method | Path | Body | Result |
|--------|------|------|--------|
| GET | `/api/races` | — | All racing markets + current odds |
| GET | `/api/user/balance` | — | `{ balance }` |
| POST | `/api/wallet/deposit` | `{ amount }` | `{ balance }`; ledger deposit |
| POST | `/api/wallet/withdraw` | `{ amount }` | `{ balance }` or 400 if amount > balance; ledger withdrawal |
| GET | `/api/transactions` | — | Full ledger, newest-first or chronological (pick one, document, test) |
| POST | `/api/bets` | `{ marketId, selectionId, stake, oddsSeen }` | Pending bet (racing) or immediately settled bet (casino); debit wallet; ledger `bet-debit` |
| GET | `/api/bets` | — | Full bet history |
| POST | `/api/admin/settle` | `{ marketId, outcome }` `outcome`: `won` \| `lost` \| `push` | See §10 |
| GET | `/api/health` | — | `{ ok: true }` (dev convenience) |

Optional for casino (if a single `POST /api/bets` is too awkward for RNG): `POST /api/casino/play` that **internally** calls the same `placeBet` + instant `settle` functions. UI still goes through the client API module.

**Debug (server-side, Part 7):**

- Artificial delay **0–3000ms** on **all** responses (in-memory setting)
- One-shot: next `POST /api/bets` (or casino play) returns **500**, then the flag resets
- Client debug panel (`?debug=true`) reads/writes these settings (small `GET/POST /api/debug` is allowed)

Client API module return shape stays `{ ok, data, error }` so the store does not need a rewrite.

## 10. Settlement engine

### 10.1 Automatic (racing)

Existing winner-pick path. Each pending bet on that race: won if `selectionId === winnerId`, else lost. Wins credit `stake × odds` and write `bet-credit`.

### 10.2 Admin “Simulate Result”

Visible **Admin** nav item. Panel `admin-settle-panel`: per racing market, outcome control + submit.

`POST /api/admin/settle`:

1. If market already settled (no pending bets / market status settled): **reject with a clear error** (do not pay again)
2. Find every **pending** bet on `marketId`
3. Apply the same `outcome` to each:
   - **won** — credit `stake × odds`, status `won`, ledger `bet-credit`
   - **lost** — status `lost`, credit 0, no extra ledger (debit already recorded at place)
   - **push** — credit **exact original stake**, status `push`, ledger `bet-credit` of that stake
4. Mark the racing market `settled` so a second settle is a no-op/reject

Casino games **do not** use this panel; they settle in the play request.

## 11. Casino

Nav section **Casino**. Each game reuses wallet + `placeBet` + settlement functions. Instant settle on the server in the same play (no admin, no “race in progress”).

| Game | Player choice | Result |
|------|---------------|--------|
| Dice | Number 1–6 or over/under a threshold | Roll 1–6; pay decimal odds documented in UI |
| Coinflip | Heads / tails | Fair coin; even money (~2.00 minus any documented house edge — pick even money 2.00 and state it) |
| Roulette | Red / black / odd / even / single number (0–36, simplified wheel) | Instant spin; standard-ish payouts (30x number, 2x even-money); **no** full 37-pocket layout required |
| Slots | Stake only | 3 reels, small symbol set, payout table; **1–2s reel animation** then result (`in-progress` / animating test id) |
| Blackjack | Stake, then Hit / Stand | Single hand vs dealer, simplified: no splits/insurance; settle at hand end |
| Poker | Stake, then draw | Five-card draw **video-poker** vs a **fixed payout table** (not multiplayer) |

Each game: `data-testid` root, bet input, play button, result region, and observable states: idle, bet placed / in-progress (slots animation, blackjack hand), result shown, wallet updated.

## 12. `data-testid` convention

### 12.1 Existing (keep exactly)

| Test id | Element |
|---------|---------|
| `race-card-{raceId}` | Race card / list row |
| `race-status-{raceId}` | Status text |
| `countdown-{raceId}` | Countdown display |
| `runner-row-{raceId}-{runnerId}` | Runner row |
| `odds-value-{raceId}-{runnerId}` | Current odds control/value |
| `betslip-panel` | Persistent betslip |
| `betslip-leg-{legIndex}` | Leg row (0-based) |
| `betslip-stake-input-{legIndex}` | Stake field |
| `betslip-remove-leg-{legIndex}` | Remove-leg |
| `betslip-total-stake` | Total stake |
| `betslip-total-payout` | Total potential payout |
| `betslip-place-bet-button` | Place Bet |
| `betslip-odds-changed-warning` | Odds-moved warning |
| `wallet-balance` | Wallet balance (plain number) |
| `bet-history-list` | History list |
| `bet-history-row-{betId}` | History row |
| `bet-history-status-{betId}` | Bet status |

Existing extras (`races-loading`, `races-list`, `nav-*`, `betslip-empty`, `bet-history-empty`, `betslip-error`, …) stay kebab-case.

### 12.2 New (use exactly)

| Test id | Element |
|---------|---------|
| `wallet-deposit-button` / `wallet-withdraw-button` | Open modals |
| `wallet-deposit-modal` / `wallet-withdraw-modal` | Modal containers |
| `wallet-deposit-amount-input` / `wallet-withdraw-amount-input` | Amount fields |
| `transaction-history-table` | Ledger table |
| `transaction-row-{transactionId}` | Ledger row |
| `admin-settle-panel` | Admin panel |
| `admin-settle-outcome-select-{marketId}` | Won / Lost / Push control |
| `admin-settle-submit-{marketId}` | Submit settle |
| `casino-dice-root` / `casino-coinflip-root` / `casino-roulette-root` / `casino-slots-root` / `casino-blackjack-root` / `casino-poker-root` | Game roots |
| `casino-{game}-bet-input` | Stake on that game (`dice`, `coinflip`, `roulette`, `slots`, `blackjack`, `poker`) |
| `casino-{game}-play-button` | Play / deal |
| `casino-{game}-result` | Result copy |
| `stake-validation-error` | Stake validation message (betslip and casino) |
| `bet-error-toast` | Dismissible request error |
| `debug-panel` | Debug panel (`?debug=true` only) |
| `debug-delay-input` | Artificial delay 0–3000 |
| `debug-force-error-toggle` | One-shot next bet 500 |

Stake fields also carry `data-max-stake="5000"`.

## 13. Loading, errors, debug

- Race list / history / wallet / casino play show loading during in-flight requests (server delay may be 0–3000ms when debug is set; default server delay may be 0 or a small constant)
- Empty betslip and empty history stay
- Place Bet actually disabled while in flight
- Failed placement: dismissible `bet-error-toast` (500 / network); validation stays on `stake-validation-error` / `betslip-error`
- Debug UI only when URL has `debug=true` (dev convenience; no separate build flavor required)

## 14. Session persistence

On app load the client **fetches** `GET /api/user/balance`, `GET /api/bets`, `GET /api/races` (existing `hydrate()`). It must not reset Zustand to 1000 / empty bets if the server already has data. **No `localStorage` copy of wallet or bets.**

## 15. Non-functional

- Predictable, semantic DOM
- Two processes in development; one `npm run dev`
- Server memory is enough; functions in front of data so a DB can replace arrays later
- Do not rebuild racing list, countdown, odds click-to-slip, or history row structure
