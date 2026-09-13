import { test, expect } from "@playwright/test";

const OPEN_RACES = [
  {
    id: "race-1",
    name: "Opening Sprint",
    trackName: "Meadowbrook Park",
    status: "upcoming",
    postTime: Date.now() + 10 * 60 * 1000,
    raceDurationMs: 15000,
    winnerId: null,
    runners: [
      {
        id: "r1-1",
        name: "Juniper",
        silkColor: "#c0392b",
        odds: 3.5,
        oddsHistory: [3.5],
      },
      {
        id: "r1-2",
        name: "Larkspur",
        silkColor: "#2980b9",
        odds: 4.2,
        oddsHistory: [4.2],
      },
    ],
  },
];

async function stubOpenMarkets(page) {
  const snapshot = {
    races: OPEN_RACES,
    walletBalance: 1000,
    bets: [],
    transactions: [],
  };
  await page.route("**/api/races", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (route.request().method() === "GET" && pathname.endsWith("/api/races")) {
      await route.fulfill({ json: { ok: true, data: OPEN_RACES } });
      return;
    }
    await route.continue();
  });
  await page.route("**/api/state", async (route) => {
    await route.fulfill({ json: { ok: true, data: snapshot } });
  });
}

test("race list and race detail behave correctly", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  const firstRaceCard = page.locator('[data-testid^="race-card-"]').first();
  await expect(firstRaceCard).toBeVisible();
  await firstRaceCard.click();

  await expect(page.locator('[data-testid^="race-detail"]')).toBeVisible();

  const runnerRows = page.locator('[data-testid^="runner-row-"]');
  await expect(runnerRows.first()).toBeVisible();
  const runnerCount = await runnerRows.count();
  expect(runnerCount).toBeGreaterThanOrEqual(6);
  expect(runnerCount).toBeLessThanOrEqual(10);

  const oddsTexts = await page
    .locator('[data-testid^="odds-value-"]')
    .allTextContents();
  for (const odds of oddsTexts) {
    expect(odds).toMatch(/^\d+\.\d{2}$/);
  }
});
test("Betslip add / duplicate / remove / clear", async ({ page }) => {
  await stubOpenMarkets(page);
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("races-list")).toBeVisible();

  const odds = page.getByTestId(/^odds-value-/);
  await expect(odds).toHaveCount(2);
  await expect(odds.nth(0)).toBeEnabled();

  await odds.nth(0).click();
  await expect(page.getByTestId("betslip-leg-0")).toBeVisible();
  await odds.nth(0).click();
  await expect(page.getByTestId("betslip-info")).toContainText(
    "already on the betslip",
  );
  await expect(page.getByTestId("betslip-leg-1")).toHaveCount(0);

  await odds.nth(1).click();
  await expect(page.getByTestId("betslip-leg-1")).toBeVisible();
  await page.getByTestId("betslip-stake-input-0").fill("10");
  await expect(page.getByTestId("betslip-total-stake")).toHaveText("20");
  await page.getByTestId("betslip-remove-leg-0").click();
  await page.getByTestId("betslip-clear-button").click();
  await expect(page.getByTestId("betslip-empty")).toBeVisible();
});

test("app loads and shows wallet balance", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("wallet-balance")).toBeVisible();
  await expect(page.getByTestId("wallet-balance")).toHaveText("1000");
});
test("app loads and shows shell", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("app-header")).toBeVisible();
});
test("app loads and shows betslip-panel", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("betslip-panel")).toBeVisible();
  await expect(page.getByTestId("betslip-empty")).toBeVisible();
});
test("app loads and shows nav-races", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("nav-races")).toBeVisible();
});
test("app loads and shows race list", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("races-list")).toBeVisible();
});

test("clicking a race shows its details", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("races-list")).toBeVisible();
  await expect(page.getByTestId("race-card-race-1")).toBeVisible();
  await page.getByTestId("race-card-race-1").click();
  await expect(page.getByTestId("race-detail-race-1")).toBeVisible();
});

test("app loads and shows live decimal odds", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("tab-live")).toBeVisible();
  await page.getByTestId("tab-live").click();
  await page.getByTestId("tab-meetings").click();
  await expect(page.getByTestId("races-list")).toBeVisible();
  await expect(page.getByTestId("runner-row-race-1-r1-1")).toBeVisible();
  await expect(page.getByTestId("odds-value-race-1-r1-1")).toBeVisible();
});

test("app loads and shows live countdown", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("races-list")).toBeVisible();
  await expect(page.getByTestId("countdown-race-1")).toBeVisible();
});

test("app loads and shows live status", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("races-list")).toBeVisible();
  await expect(page.getByTestId("race-card-race-1")).toBeVisible();
  await expect(page.getByTestId("race-status-race-1")).toBeVisible();
});

test("app loads and shows betslip", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  const betslipButton = page.getByRole("button", { name: /betslip|slip/i });
  await expect(page.getByTestId("betslip-panel")).toBeVisible();
  await page.getByTestId("betslip-panel").click();
});

test("app loads and shows loading state", async ({ page }) => {
  const delay = async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  };
  // Delay only API calls. Intercepting **/* serializes Vite ESM and flakes on Firefox.
  await page.route("**/api/races", delay);
  await page.route("**/api/state", delay);
  await page.goto("http://localhost:5173/BiscuIT/", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByTestId("races-loading")).toBeVisible();
  await expect(page.getByTestId("races-list")).toBeVisible({ timeout: 10_000 });
});

test("app loads and shows empty state", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("races-list")).toBeVisible();
  await page.getByTestId("nav-history").click();
  await expect(page.getByTestId("bet-history-empty")).toBeVisible();
  await expect(page.getByTestId("bet-history-empty")).toHaveText(
    "No bets placed yet.",
  );
});

test("shows validation when stake is empty", async ({ page }) => {
  await stubOpenMarkets(page);
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("races-list")).toBeVisible();
  const odds = page.getByTestId(/^odds-value-/).first();
  await expect(odds).toBeEnabled();
  await odds.click();
  await page.getByTestId("betslip-stake-input-0").fill("0");
  await page.getByTestId("betslip-place-bet-button").click();
  await expect(page.getByTestId("betslip-error")).toHaveText(
    "Stake must be greater than 0.",
  );
});

test("shows error when betting is closed", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("races-list")).toBeVisible();

  const openRace = await page.evaluate(async () => {
    const races = await window.__ODDS_ENGINE__.getRaces();
    const list = Array.isArray(races) ? races : [];
    const open = list.find((race) => race.status === "upcoming");
    return open ? { id: open.id, runnerId: open.runners[0].id } : null;
  });
  test.skip(!openRace, "No upcoming race to lock.");

  const { id: raceId, runnerId } = openRace;
  const odds = page.getByTestId(`odds-value-${raceId}-${runnerId}`);
  await expect(odds).toBeEnabled();
  await odds.click();
  await page.getByTestId("betslip-stake-input-0").fill("10");

  await page.evaluate(async (id) => {
    await window.__ODDS_ENGINE__.lockRace(id);
  }, raceId);
  await expect(page.getByTestId(`race-status-${raceId}`)).not.toHaveText(
    "upcoming",
  );

  await page.getByTestId("betslip-place-bet-button").click();
  await expect(page.getByTestId("betslip-error")).toBeVisible();
  await expect(page.getByTestId("betslip-error")).toContainText(
    /Betting is closed|locked/i,
  );
});
