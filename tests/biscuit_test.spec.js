import { test, expect } from "@playwright/test";
test("app loads and shows wallet balance", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("wallet-balance")).toBeVisible();
});
test("app loads and shows race list", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("races-list")).toBeVisible();
});
test("app loads and shows race details", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await expect(page.getByTestId("race-details")).toBeVisible();
});
// });
// test("app loads and shows live decimal odds", async ({ page }) => {
//   await expect(page.getByTestId("live-decimal-odds")).toBeVisible();
// });
// test("app loads and shows live countdown", async ({ page }) => {
//   await expect(page.getByTestId("live-countdown")).toBeVisible();
//   await expect(page.getByTestId("live-countdown")).toHaveText("00:00:00");
// });
// test("app loads and shows live status", async ({ page }) => {
//   await expect(page.getByTestId("live-status")).toBeVisible();
//   await expect(page.getByTestId("live-status")).toHaveText("Live");
// });
// test("app loads and shows betslip", async ({ page }) => {
//   await expect(page.getByTestId("betslip")).toBeVisible();
//   await expect(page.getByTestId("betslip")).toHaveText("Betslip");
// });
// test("app loads and shows odds-moved confirmation", async ({ page }) => {
//   await expect(page.getByTestId("odds-moved-confirmation")).toBeVisible();
//   await expect(page.getByTestId("odds-moved-confirmation")).toHaveText(
//     "Odds moved",
//   );
// });
// test("app loads and shows bet history", async ({ page }) => {
//   await expect(page.getByTestId("bet-history")).toBeVisible();
//   await expect(page.getByTestId("bet-history")).toHaveText("Bet history");
// });
// test("app loads and shows loading state", async ({ page }) => {
//   await expect(page.getByTestId("loading-state")).toBeVisible();
//   await expect(page.getByTestId("loading-state")).toHaveText("Loading...");
// });
// test("app loads and shows empty state", async ({ page }) => {
//   await expect(page.getByTestId("empty-state")).toBeVisible();
//   await expect(page.getByTestId("empty-state")).toHaveText(
//     "No bets placed yet",
//   );
// });
// test("app loads and shows validation state", async ({ page }) => {
//   await expect(page.getByTestId("validation-state")).toBeVisible();
//   await expect(page.getByTestId("validation-state")).toHaveText(
//     "Validation state",
//   );
// });
// test("app loads and shows error state", async ({ page }) => {
//   await expect(page.getByTestId("error-state")).toBeVisible();
//   await expect(page.getByTestId("error-state")).toHaveText("Error state");
// });
