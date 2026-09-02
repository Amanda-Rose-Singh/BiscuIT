import { test, expect } from "@playwright/test";

test("app loads and shows wallet balance", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("wallet-balance")).toBeVisible();
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
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("races-list")).toBeVisible();
  await page.getByTestId("odds-value-race-1-r1-1").click();
  await page.getByTestId("betslip-stake-input-0").fill("0");
  await page.getByTestId("betslip-place-bet-button").click();
  await expect(page.getByTestId("betslip-error")).toBeVisible();
  await expect(page.getByTestId("betslip-error")).toHaveText(
    "Each stake must be greater than 0.",
  );
});

test("shows error when betting is closed", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("races-list")).toBeVisible();
  await page.getByTestId("odds-value-race-1-r1-1").click();
  await page.getByTestId("betslip-stake-input-0").fill("10");
  await page.evaluate(() => window.__ODDS_ENGINE__.lockRace("race-1"));
  await page.getByTestId("betslip-place-bet-button").click();
  await expect(page.getByTestId("betslip-error")).toBeVisible();
  await expect(page.getByTestId("betslip-error")).toContainText(
    /Betting is closed|locked/i,
  );
});
