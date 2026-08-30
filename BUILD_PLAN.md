# Build plan

Phased order. Each phase should leave the app runnable.

## Phase 0 — Spec and scaffold

- `REQUIREMENTS.md` and this plan in repo root
- Vite + React (JavaScript) in the existing repo
- Plain CSS, `data-testid`s from the start
- `.gitignore` for `node_modules` / `dist`

## Phase 1 — Mock “backend”

- `src/data/seed.js` — 6 races, 6–10 runners, post times 30s–3min, silks, decimal odds
- `src/api/serverState.js` — in-memory races, wallet (1000), bets, bet id counter
- `src/api/mockApi.js` — `delay()`, `getRaces`, `getRace`, `getWallet`, `getBets`, `placeBet`, `subscribe`
- Artificial latency 150–600ms; `placeBet` ~5% random rejection plus validation

## Phase 2 — Store and shell

- Zustand store: `view`, selected race, races snapshot, betslip, wallet, bets, loading/error flags
- App shell: header (wallet + nav), main view region, persistent betslip sidebar
- Views: Races, Race detail, Bet history, Wallet (placeholders OK until later phases)

## Phase 3 — Race UI

- Race list cards: name, track, `race-status-*`, `countdown-*`
- Race detail: runner rows, silk swatch, clickable `odds-value-*`
- Countdown display driven off post time (1s UI tick)

## Phase 4 — Odds engine

- Interval 2–4s: nudge odds for `upcoming` races; freeze otherwise
- Post time → `in-progress`, lock betting for that race
- After 10–20s → `closed` then `settled`; pick winner; resolve pending bets; credit wallet on wins
- `window.__ODDS_ENGINE__` for inspectability (state getters; no need for tests in this repo)

## Phase 5 — Betslip

- Add leg from odds click (upcoming only; locked race → visible error)
- Stake inputs, remove, clear, totals
- Place Bet: stake > 0, wallet check, current vs captured odds → warning + explicit confirm
- Wire to `placeBet()`; surface API and lock errors

## Phase 6 — History and wallet

- History list with required test ids; statuses update on settlement
- Wallet view + header `wallet-balance` stay in sync with the store

## Phase 7 — Polish

- Loading/empty/error states
- Disabled/locked affordances on closed races
- Visual pass: readable sportsbook layout, no UI kit

## Phase 8 — Final wiring

- End-to-end click path in the browser: add leg → stake → place → history → wait for settle
- Confirm test ids match the spec table
- No extra docs that describe implementation tricks

## Done when

- All four views work with a persistent betslip
- Mock API is the only “backend” boundary
- Engine is exposed on `window.__ODDS_ENGINE__`
- Required `data-testid`s are present and stable
