// import { test, expect } from "@playwright/test";
// test("app loads and shows wallet balance", async ({ page }) => {
//   await page.goto("http://localhost:5173/BiscuIT/");
//   await expect(page.getByTestId("wallet-balance")).toBeVisible();
// });
// test("app loads and shows race list", async ({ page }) => {
//   await page.goto("http://localhost:5173/BiscuIT/");
//   await expect(page.getByTestId("races-list")).toBeVisible();
// });
// test("clicking a race shows its details", async ({ page }) => {
//   await page.goto("http://localhost:5173/BiscuIT/");
//   await expect(page.getByTestId("races-list")).toBeVisible();
//   await expect(page.getByTestId("race-card-race-1")).toBeVisible();
//   await page.getByTestId("race-card-race-1").click();
//   await expect(page.getByTestId("race-detail-race-1")).toBeVisible();
// });
// test("app loads and shows live decimal odds", async ({ page }) => {
//   await page.goto("http://localhost:5173/BiscuIT/");
//   await expect(page.getByTestId("tab-live")).toBeVisible();
//   await page.getByTestId("tab-live").click();
//   await page.getByTestId("tab-meetings").click();
//   await expect(page.getByTestId("races-list")).toBeVisible();
//   await expect(page.getByTestId("runner-row-race-1-r1-1")).toBeVisible();
//   await expect(page.getByTestId("odds-value-race-1-r1-1")).toBeVisible();
// });

// test("app loads and shows live countdown", async ({ page }) => {
//   await page.goto("http://localhost:5173/BiscuIT/");
//   await expect(page.getByTestId("races-list")).toBeVisible();
//   await expect(page.getByTestId("countdown-race-1")).toBeVisible();
// });
// test("app loads and shows live status", async ({ page }) => {
//   await page.goto("http://localhost:5173/BiscuIT/");
//   await expect(page.getByTestId("races-list")).toBeVisible();
//   await expect(page.getByTestId("race-card-race-1")).toBeVisible();
//   await expect(page.getByTestId("race-status-race-1")).toBeVisible();
// });
// test("app loads and shows betslip", async ({ page }) => {
//   await page.goto("http://localhost:5173/BiscuIT/");
//   await expect(page.getByTestId("Betslip")).toBeVisible();
//   await page.getByTestId("Betslip").click();
//   await expect(page.getByTestId("open-betslip")).toBeVisible();
//   await expect(page.getByTestId("open-betslip")).toHaveText("Betslip");
// });
test("app loads and shows loading state", async ({ page }) => {
  await page.goto("http://localhost:5173/BiscuIT/");
  await page.getByTestId("race-card-race-1").click();
  await expect(page.getByTestId("loading-state")).toBeVisible();
  await expect(page.getByTestId("loading-state")).toHaveText("Loading...");
});
// });
// test("app loads and shows empty state", async ({ page }) => {
//   await page.goto("http://localhost:5173/BiscuIT/");
//   page.getByTestId("race-card-race-1").click();
//   await expect(page.getByTestId("races-list")).toBeVisible();
//   await expect(page.getByTestId("race-card-race-1")).toBeVisible();
//   await page.getByTestId("race-card-race-1").click();
//   await expect(page.getByTestId("empty-state")).toBeVisible();
//   await expect(page.getByTestId("empty-state")).toHaveText(
//     "No bets placed yet",
//   );
// });
// test("app loads and shows validation state", async ({ page }) => {
//   await page.goto("http://localhost:5173/BiscuIT/");
//   page.getByTestId("race-card-race-1").click();
//   await expect(page.getByTestId("races-list")).toBeVisible();
//   await expect(page.getByTestId("race-card-race-1")).toBeVisible();
//   await page.getByTestId("race-card-race-1").click();
//   await expect(page.getByTestId("validation-state")).toBeVisible();
//   await expect(page.getByTestId("validation-state")).toHaveText(
//     "Validation state",
//   );
// });
// test("app loads and shows error state", async ({ page }) => {
//   await page.goto("http://localhost:5173/BiscuIT/");
//   page.getByTestId("race-card-race-1").click();
//   await expect(page.getByTestId("races-list")).toBeVisible();
//   await expect(page.getByTestId("race-card-race-1")).toBeVisible();
//   await page.getByTestId("race-card-race-1").click();
//   await expect(page.getByTestId("error-state")).toBeVisible();
//   await expect(page.getByTestId("error-state")).toHaveText("Error state");
// });
