/**
 * DEMO01 smoke E2E — run against a live dev server:
 *   1. npm run dev
 *   2. npm run test:e2e
 *
 * playwright.config.ts can also start `npm run dev` when no server is listening
 * (reuseExistingServer: true reuses an already-running dev server).
 */
import { test, expect } from "@playwright/test";

const EVENT = "DEMO01";

test.describe("DEMO01 smoke", () => {
  test("admin page loads dashboard shell", async ({ page }) => {
    await page.goto(`/admin/${EVENT}`);

    await expect(
      page
        .getByRole("button", { name: "Controlli" })
        .or(page.getByText("Pannello animatore")),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("display page loads projector canvas", async ({ page }) => {
    await page.goto(`/s/${EVENT}/display`);

    await expect(page.locator('[data-projector-canvas="1"]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(new RegExp(EVENT, "i"))).toBeVisible();
  });

  test("play page loads join form or player shell", async ({ page }) => {
    await page.goto(`/s/${EVENT}/play`);

    const joinShell = page.getByRole("heading", { name: "Entra in sala" });
    const playerShell = page.getByText(/BENVENUT|Quiz in corso|Rispondi ora|manche/i);

    await expect(joinShell.or(playerShell)).toBeVisible({ timeout: 30_000 });
  });
});
