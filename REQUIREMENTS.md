# BiscuIT — Simulated Horse Racing Sportsbook

Front-end-only React app for a QA / automation portfolio. No real backend, money, or odds feeds. All data and “network” behavior are simulated in the browser. State may reset on refresh.

## 1. Purpose

Provide a stable, testable sportsbook UI (races, live odds, betslip, wallet, bet history) so Playwright (or similar) can exercise loading states, validation, race-lifecycle transitions, and error paths.

## 2. Out of scope

- Real APIs, databases, auth, or payments
- Routing libraries (optional; a view switch is sufficient)
- Heavy UI kits
- Automated tests in this repository (tests are written separately)

## 3. Tech constraints

| Area | Choice |
|------|--------|
| UI | React + Vite |
| Styling | Plain CSS, simple DOM |
| State | One store (Zustand) |
| Persistence | In-memory only |
| Network | Mock module with 150–600ms delay |

Every interactive control and key state container MUST have a stable `data-testid` (see §10).

## 4. Domain model

### 4.1 Race

- `id`, `name`, `trackName`
- `6–10` runners
- `status`: `upcoming` \| `in-progress` \| `closed` \| `settled`
- Countdown to post time (seeded in the **30s–3min** range for short test cycles)
- After lock: a simulated race duration of **10–20s**, then settlement

**Seed:** 5–8 races on first load.

### 4.2 Runner

- `id`, `name`
- Silk color (CSS color swatch)
- Current odds in **decimal** form (e.g. `3.50`)
- Odds history (array of previous decimal values)

### 4.3 Betslip leg

- Race identity, runner identity
- Odds **captured at add time**
- Stake (user-editable)
- Removable individually; slip can be cleared

### 4.4 Bet (history)

- Race, runner, stake, odds, potential payout
- `status`: `pending` \| `won` \| `lost`
- Settled payout when resolved

### 4.5 Wallet

- Starting balance: **1000** mock credits
- Decreases on successful placement; increases on winning settlement
- Balance shown as a **plain number** in the DOM (not canvas/SVG)

## 5. Views

A simple in-app view switch (no router required):

1. **Races** — list of race cards (status, countdown, entry to detail)
2. **Race detail** — runners, silks, live odds (click odds to add a leg)
3. **Bet history** — list of placed bets
4. **Wallet** — balance and a short summary of credits in/out if useful

The **betslip** is persistent across views (sidebar).

## 6. Odds engine (simulated live market)

- For every **upcoming** race, on an interval of **2–4 seconds**, nudge each runner’s odds up or down by a small random amount (keep odds above a sane floor, e.g. 1.10). Append previous value to `oddsHistory`.
- When a race’s **post time** is reached:
  - Status → `in-progress`
  - Odds **freeze**
  - That race **cannot** accept new betslip legs; existing legs for that race cannot be placed
- After the simulated race duration:
  - Status → `settled` (may pass through `closed` if useful for a distinct UI state)
  - Exactly one runner is chosen at random as winner
  - All **pending** bets on that race resolve (`won` / `lost`); wallet is credited for wins

The engine MUST be inspectable from the page:

- Expose `window.__ODDS_ENGINE__` with read access to current races, odds, statuses, wallet, and bets (and any helpers useful for tests).
- This **supplements** `data-testid`s; it does not replace them.

## 7. Betslip behavior

- Clicking a runner’s odds on an **upcoming** race adds a leg (same runner+race should not duplicate; updating or ignoring a duplicate is fine if the UI is obvious).
- Each leg: race, runner, odds-at-add, stake input.
- Live totals: **total stake**, **total potential payout**.
- **Place Bet**:
  1. Every stake must be **> 0**
  2. Total (or per-leg) stake must not exceed **wallet balance**
  3. Re-read **current** market odds vs odds-at-add. If they differ, show a warning and require an **explicit confirm** before submit. Do **not** silently take a new price.
  4. Reject legs whose race is no longer open for betting, with visible feedback
- Remove leg, clear slip, locked-race attempts, validation errors, and API errors must all surface in the UI (no silent no-ops).

## 8. Mock API layer

All “backend” traffic goes through one module (e.g. `src/api/mockApi.js`), even though it is local.

Suggested surface:

- `getRaces()` / `getRace(id)`
- `placeBet(payload)`
- `getWallet()`
- `getBets()`
- `subscribeToOdds(listener)` (or equivalent subscription)

Rules:

- Every call waits a random **150–600ms**
- `placeBet()` fails about **5%** of the time with a realistic error (`insufficient funds` or generic `bet rejected`) in addition to deterministic validation failures
- This is the plug-in point a real API would replace

## 9. Loading and errors

- Race list / detail / history / wallet fetches show a loading state during mock latency
- Place-bet failures show a message on or near the betslip
- Empty betslip and empty history have clear empty states

## 10. `data-testid` convention (mandatory)

Use these names **exactly**:

| Test id | Element |
|---------|---------|
| `race-card-{raceId}` | Race card / list row |
| `race-status-{raceId}` | Status text |
| `countdown-{raceId}` | Countdown display |
| `runner-row-{raceId}-{runnerId}` | Runner row |
| `odds-value-{raceId}-{runnerId}` | Current odds control/value |
| `betslip-panel` | Persistent betslip container |
| `betslip-leg-{legIndex}` | Leg row (`legIndex` 0-based) |
| `betslip-stake-input-{legIndex}` | Stake field |
| `betslip-remove-leg-{legIndex}` | Remove-leg control |
| `betslip-total-stake` | Total stake |
| `betslip-total-payout` | Total potential payout |
| `betslip-place-bet-button` | Place Bet |
| `betslip-odds-changed-warning` | Odds-moved warning |
| `wallet-balance` | Wallet balance (plain number) |
| `bet-history-list` | History list container |
| `bet-history-row-{betId}` | History row |
| `bet-history-status-{betId}` | Bet status |

Additional test ids may be added for nav, errors, and empty states; they must be stable and kebab-case.

## 11. Non-functional

- Predictable, semantic DOM for selector stability
- No real network requests
- Refresh resets all simulation state
