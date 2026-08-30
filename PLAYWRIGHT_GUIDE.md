# Playwright automation guide — BiscuIT sportsbook

This is a **how to write tests** document, not a test suite. Keep tests in a separate project or folder if you are using this app as a portfolio target.

Pair this file with `REQUIREMENTS.md` (functional spec) and the `data-testid` table in §10 of that spec.

## 1. What you are testing

A front-end-only simulated sportsbook at `http://localhost:5173` (Vite). There is **no real backend**. Mock latency is **150–600ms**. App state **resets on refresh**.

You will automate:

- Race list and race detail
- Live decimal odds and countdown / status
- Betslip (add, stake, remove, clear, place)
- Odds-moved confirmation
- Wallet and bet history
- Loading, empty, validation, and error UI

## 2. One-time setup

Terminal 1 — app:

```bash
npm install
npm run dev
```

Terminal 2 — new Playwright project (recommended: sibling folder or `e2e/` that you own):

```bash
npm init playwright@latest
```

In `playwright.config.ts`:

- `baseURL: 'http://localhost:5173'`
- `webServer` optional: `{ command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI }`
- Prefer `fullyParallel: false` at first; the odds engine and shared in-memory state make parallel tabs on one app instance fight each other
- Use a **fresh page (and reload) per test** so wallet / slip / races start clean

Install browsers if prompted: `npx playwright install`

## 3. Locator strategy (do this first)

**Primary:** `page.getByTestId(...)`. Do not use CSS class names or fragile nth-of-type chains for core assertions.

Required ids (IDs in the app today: races `race-1` … `race-6`, runners like `r1-1`):

| Test id | Use |
|---------|-----|
| `races-loading` | First paint while mock `getRaces` is in flight |
| `races-list` / `race-card-{raceId}` | Open a race |
| `race-status-{raceId}` | `upcoming` / `in-progress` / `closed` / `settled` |
| `countdown-{raceId}` | Visible timer (`m:ss` or `Off`) |
| `odds-value-{raceId}-{runnerId}` | Click to add a leg; read displayed odds |
| `betslip-panel` | Always present |
| `betslip-empty` | No legs |
| `betslip-leg-{n}` | 0-based |
| `betslip-stake-input-{n}` | Stake |
| `betslip-remove-leg-{n}` | Remove one leg |
| `betslip-clear-button` | Clear slip |
| `betslip-total-stake` / `betslip-total-payout` | Totals |
| `betslip-place-bet-button` | Place / confirm after odds move |
| `betslip-odds-changed-warning` | Must appear if price moved |
| `betslip-error` / `betslip-info` | Failures and success copy |
| `wallet-balance` | Header balance (plain number) |
| `nav-races` / `nav-history` / `nav-wallet` | View switch |
| `bet-history-list` / `bet-history-row-{betId}` / `bet-history-status-{betId}` | History |
| `bet-history-empty` | No bets yet |

Helper:

```ts
const tid = (id: string) => page.getByTestId(id);
```

Wait for the card, not a fixed `sleep`:

```ts
await page.goto('/');
await expect(page.getByTestId('races-loading')).toBeVisible();
await expect(page.getByTestId('races-list')).toBeVisible({ timeout: 10_000 });
```

## 4. Debug hook (use for market state, not instead of UI)

After load:

```ts
const engine = await page.evaluate(() => window.__ODDS_ENGINE__);
```

Useful methods (see `src/engine/oddsEngine.js`):

- `getState()` — races, wallet, bets
- `getRaces()` / `getRace(id)` / `getOdds(raceId, runnerId)`
- `getWallet()` / `getBets()`
- `getPostTime(raceId)`
- `lockRace(raceId)` / `settleRace(raceId)` — **test control**, not a user action. Use them when you need a locked or settled race without waiting minutes. Still assert the **UI** (`race-status-*`, disabled odds, history status).

Example: read engine wallet vs header:

```ts
const ui = await page.getByTestId('wallet-balance').innerText();
const engineBalance = await page.evaluate(() => window.__ODDS_ENGINE__.getWallet());
```

Treat mismatches as findings, not as “the engine is the source of truth.” Requirements say the hook **supplements** test ids.

Type it in tests if you want:

```ts
declare global {
  interface Window {
    __ODDS_ENGINE__: {
      getState: () => unknown;
      getRaces: () => { id: string; status: string; runners: { id: string; odds: number }[] }[];
      getRace: (id: string) => { id: string; status: string } | null;
      getWallet: () => number;
      getBets: () => { id: string; status: string; stake: number }[];
      getOdds: (raceId: string, runnerId: string) => number | null;
      getPostTime: (raceId: string) => number | null;
      lockRace: (raceId: string) => void;
      settleRace: (raceId: string) => void;
    };
  }
}
```

## 5. Stability rules for this app

1. **Latency** — any “after click, see X” needs Playwright auto-wait or `expect(...).toBeVisible()`, not `waitForTimeout(100)`.
2. **Odds tick every 2–4s** — displayed odds on the race card **will change** while the slip holds **odds at add**. Do not assert a frozen market price unless you lock the race first.
3. **`placeBet` ~5% random reject** — happy-path “place always succeeds” will flake. Retry the place once, or loop until success/error with a cap, or run the assertion on either `betslip-info` or `betslip-error`. Document the flake in the report if you treat random reject as a product behavior.
4. **Countdowns are short (30s–3min)** — prefer `race-6` (longest seed) for betting tests; use `lockRace` when you specifically need a closed market.
5. **One user, one store** — do not run two workers against one `npm run dev` if both mutate wallet/bets. Isolate with serial mode or separate processes (hard here because state is in the page).

## 6. Suggested helpers (page object sketch)

Keep one file, e.g. `sportsbook.page.ts`:

```ts
export class SportsbookPage {
  constructor(private page: import('@playwright/test').Page) {}

  async open() {
    await this.page.goto('/');
    await this.page.getByTestId('races-list').waitFor();
  }

  async openRace(raceId: string) {
    await this.page.getByTestId(`race-card-${raceId}`).click();
    await this.page.getByTestId(`race-detail-${raceId}`).waitFor();
  }

  async addFirstUpcomingRunner(raceId: string) {
    const odds = this.page.locator(`[data-testid^="odds-value-${raceId}-"]`).first();
    await expect(odds).toBeEnabled();
    await odds.click();
    await expect(this.page.getByTestId('betslip-leg-0')).toBeVisible();
  }

  async setStake(index: number, amount: string) {
    await this.page.getByTestId(`betslip-stake-input-${index}`).fill(amount);
  }

  async placeBet() {
    await this.page.getByTestId('betslip-place-bet-button').click();
    const warning = this.page.getByTestId('betslip-odds-changed-warning');
    if (await warning.isVisible()) {
      await this.page.getByTestId('betslip-place-bet-button').click();
    }
  }
}
```

The second click on Place Bet is required when odds moved (see requirements §7).

## 7. Step-by-step test cases to implement

Write these as separate `test(...)` blocks. Order below is a learning path, not a run order.

### Step A — Smoke / shell

1. Navigate `/`.
2. Expect `app-header`, `betslip-panel`, `nav-races`.
3. Expect `wallet-balance` to be `1000` after load (starting credits).
4. Empty slip: `betslip-empty` visible.

### Step B — Race list

1. After loading, `races-list` has **5–8** cards (`race-card-race-*`).
2. Each card: `race-status-*` is one of the four statuses; `countdown-*` is visible.
3. Click `race-card-race-6` → `race-detail-race-6`, track name, runner list `runner-list-race-6`.
4. Runners: **6–10** rows; each has silk + `odds-value-*` with a decimal (regex `/^\d+\.\d{2}$/` is reasonable for UI text).

### Step C — Betslip add / duplicate / remove / clear

1. Click odds on an **upcoming** race → `betslip-leg-0` shows runner + race; stake input exists.
2. Click the **same** odds again → no second leg; look for `betslip-info` (“already on the betslip”).
3. Add a second runner → `betslip-leg-1`.
4. Change stake 0 → `betslip-total-stake` updates.
5. `betslip-remove-leg-0` reindexes remaining legs (`leg-0` is the leftover).
6. Clear → `betslip-empty`.

### Step D — Validation

1. Stake `0` or empty → Place Bet → `betslip-error` about stake &gt; 0; no history row.
2. Stake larger than `wallet-balance` → error about funds; balance unchanged.
3. Place with valid stake; if odds warning shows, confirm; then either success info **or** API error (5%).

### Step E — Odds confirmation (core risk case)

1. Add a leg; read odds text on the button **and** “Odds …” on the leg (add-time).
2. Wait until live `odds-value-*` **differs** from add-time (poll 2–5s ticks, timeout ~15s).
3. Place Bet **once** → `betslip-odds-changed-warning` visible; slip still has the leg; history still empty.
4. Place Bet **again** (button label includes accept) → request goes through (success or 5% reject).

Do **not** assume the app silently fills at the new price without that second click.

### Step F — Wallet and history persistence across views

1. Record `wallet-balance` before place.
2. Successful place: balance decreases by total stake; `betslip-info`; slip empty.
3. `nav-history` → `bet-history-row-bet-*`, status `pending`.
4. `nav-wallet` → `wallet-balance-detail` matches header (same number).
5. `nav-races` → header balance still the new value (in-memory, no reload).

### Step G — Locked market

1. Open an upcoming race; optionally `lockRace(id)` via `page.evaluate`.
2. UI: status not `upcoming`; `odds-value-*` **disabled**; countdown `Off`.
3. Existing slip leg for that race: `betslip-leg-locked-*` / Place Bet error that betting is closed.
4. Do not treat a silent ignore of Place Bet as passing.

### Step H — Settlement

1. Place a pending bet on a race you will settle.
2. `settleRace(raceId)` (or wait for natural settle: 10–20s after lock).
3. History status `won` or `lost`; winner tag `winner-{raceId}-{runnerId}` on detail.
4. If won, wallet increases by settled payout (compare engine `getBets()` vs UI).

### Step I — Loading and empty states

1. Throttle CPU or assert `races-loading` on a cold `goto` (reload).
2. History with no bets: `bet-history-empty`.
3. Place-bet failure copy on `betslip-error` (`Bet rejected` / `Insufficient funds` / closed race).

### Step J — Negative / messy user

1. Rapid Place Bet clicks (double-submit).
2. Place while countdown shows `0:00` (timing vs lock).
3. Multi-leg slip: one failure mid-batch vs wallet vs history.
4. Compare `betslip-total-payout` to `stake × displayed odds` over several odds ticks.
5. Rounding: payout vs wallet after odd stakes (e.g. `3.33` × odd decimals).

These last items are **exploration**, not a script of expected bugs. Record actual vs `REQUIREMENTS.md`.

## 8. Example first test (copy and extend)

```ts
import { test, expect } from '@playwright/test';

test('loads races and starting wallet', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('races-list')).toBeVisible();
  await expect(page.getByTestId('wallet-balance')).toHaveText('1000');
  await expect(page.getByTestId('betslip-empty')).toBeVisible();
  const cards = page.locator('[data-testid^="race-card-"]');
  const n = await cards.count();
  expect(n).toBeGreaterThanOrEqual(5);
  expect(n).toBeLessThanOrEqual(8);
});
```

## 9. Reporting for a portfolio

For each case, capture:

- Title mapped to a requirement section (e.g. “§7 Place Bet odds confirm”)
- Steps, expected, actual
- Screenshot / trace: `npx playwright test --trace on` then `npx playwright show-report`
- Whether you asserted **UI**, **engine**, or both

## 10. Commands

```bash
npx playwright test
npx playwright test --ui
npx playwright test tests/betslip.spec.ts --debug
npx playwright show-report
```
