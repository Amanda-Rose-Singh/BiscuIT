# Build plan (backend + casino extension)

Phased order. Each phase should leave **both** processes runnable (`npm run dev`). Do not rebuild working racing UI, betslip, or Zustand call sites — extend them.

**Gate:** this plan and `REQUIREMENTS.md` are for review before implementation.

## Conflicts to handle explicitly (not silent rewrites)

See `REQUIREMENTS.md` §4.1. Short version:

1. Move in-memory store + odds engine from `src/api/serverState.js` / `src/engine/oddsEngine.js` to `/server`. Client engine hook becomes an API-backed façade.
2. Debit wallet **inside** server `placeBet` only — today’s store `applyWalletDebit` after place would double-charge.
3. Replace random 5% `placeBet` fail with the debug one-shot 500.
4. Keep racing auto-settle (winner) **and** add admin market-wide won/lost/push.
5. Map `raceId`/`runnerId`/`odds` → `marketId`/`selectionId`/`oddsSeen` in the API adapter only.
6. Admin via pathname `/BiscuIT/admin` + nav link; debug via `?debug=true`.
7. Expand seed to 15–20 races; keep Lucky Numbers; add Casino separately.
8. `gh-pages` will not run Express — do not fake persistence with `localStorage` to paper over that.

## Phase 0 — Spec

- [x] Update `REQUIREMENTS.md` and this plan
- Wait for review before coding

## Phase 1 — Real backend (Part 1)

Leave the React app talking to the old mock until the adapter swap at the end of this phase so the UI stays up.

1. Add `/server`: Express, `cors`, JSON body parser, listen **3001**.
2. Move seed + store behind functions:
   - `getRaces()`, `getBalance(userId)`, `deposit`, `withdraw`, `placeBet`, `getBets`, `getTransactions`, `settleMarket`, `appendLedger`
   - Default `userId = "default"`, wallet **1000**
3. Implement required routes (plus `GET /api/health`).
4. Move racing odds engine timers to the server (nudge / lock / auto-settle). Same intervals as today.
5. Root `package.json`: `concurrently` — `"dev": "concurrently \"npm run dev:server\" \"npm run dev:client\""`. Vite stays on 5173.
6. Vite: proxy `/api` → `http://localhost:3001` (CORS still on).
7. Rewrite `src/api/mockApi.js` internals to `fetch`; **keep exported function names**. Map racing `placeBet({ raceId, runnerId, stake, odds })` to `POST /api/bets`.
8. Fix store so a successful place does **not** debit twice (`applyWalletDebit` removed or unused).
9. `subscribeToOdds`: poll `GET /api/races` (and apply snapshot). Drop in-process `serverState` from the client.
10. `window.__ODDS_ENGINE__`: getters via last poll / extra GET; `lockRace` / `settleRace` hit server debug or admin helpers.

**Done when:** refresh keeps wallet/bets (server still up); race list still live-updates; placing a racing bet hits Express and ledger has a debit.

## Phase 2 — Settlement admin (Part 2)

1. `POST /api/admin/settle` with won / lost / push; reject already-settled; no double-payout.
2. Bet status `push` in history UI.
3. Admin view + `nav-admin`; path `/admin` (respect Vite `base: '/BiscuIT/'`).
4. Per-market `admin-settle-outcome-select-{marketId}` + `admin-settle-submit-{marketId}`.

**Done when:** pending racing bets can be force-settled from Admin; second submit does not pay again; auto-settle still works if admin never touches the race.

## Phase 3 — Casino (Part 3)

1. Casino nav + hub; six views with required roots.
2. Shared play helper: validate stake → `placeBet` → instant settle on server (RNG on server).
3. Dice, coinflip, roulette, slots (1–2s animation then reveal), blackjack (hit/stand), video poker (payout table).
4. Testable states: idle, in-progress, result, wallet tick.

**Done when:** each game debits, settles, shows result, updates header balance and history.

## Phase 4 — More racing volume (Part 4)

1. Expand `createSeedRaces` to **15–20** markets, still SA/UK/AU.
2. No new list mechanics; confirm region filters and `races-list` still work.

## Phase 5 — Stake validation (Part 5)

1. Shared `MAX_SINGLE_STAKE = 5000`; `data-max-stake="5000"` on betslip + casino inputs.
2. Client: visible `stake-validation-error` for negative, non-numeric, zero, over balance, over max (not silent key swallowing).
3. Server: same rules on `POST /api/bets` and wallet amount posts.

## Phase 6 — Persistence check (Part 6)

1. Confirm `hydrate()` uses GET balance / bets / races only.
2. Remove any leftover “refresh resets” copy (Wallet view).
3. No `localStorage` for wallet/bets/ledger.

(Mostly a verification phase if Phase 1 was done correctly.)

## Phase 7 — Debug delay & errors (Part 7)

1. Server debug settings: delay 0–3000ms on all responses; one-shot 500 on next bet/play.
2. `GET/POST /api/debug` (or equivalent).
3. Client `debug-panel` only if `?debug=true`.
4. Place Bet / casino play **actually disabled** while in flight (betslip already has `placing`; enforce `disabled={placing}`).
5. Dismissible `bet-error-toast` on 500/network.

## Phase 8 — Test ids & polish (Part 8)

1. Audit every new control against the §12.2 table.
2. Wallet deposit/withdraw modals if not finished in Phase 1.
3. Transaction table on Wallet.
4. Quick browser pass: deposit → race bet → admin settle → casino play → withdraw reject → debug 500.

## Suggested implementation order vs your parts

| Your part | Phase |
|-----------|--------|
| 1 Real backend | Phase 1 |
| 2 Settlement admin | Phase 2 |
| 3 Casino | Phase 3 |
| 4 More races | Phase 4 |
| 5 Stake validation | Phase 5 |
| 6 Persistence | Phase 6 (verify) |
| 7 Debug network | Phase 7 |
| 8 Test ids | Continuous; audit in Phase 8 |

## Done when

- `npm run dev` starts Vite **and** Express
- Client API module is HTTP-only; UI callers unchanged in spirit
- Admin settle + auto racing settle coexist without double-pay
- Six casino games share wallet/ledger
- 15–20 races, stake rules client+server, hydrate from server, debug panel behind query param
- Required new `data-testid`s present
