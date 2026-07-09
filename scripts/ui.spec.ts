import { test, expect } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
});

test("Verify mobile dashboard rendering and captures", async ({ page }) => {
  // Navigate to local dev server
  await page.goto("http://localhost:3000");
  await page.waitForLoadState("networkidle");

  // Verify header presence
  const headerText = await page.textContent("h1, h2, h3");
  console.log("Main Header text detected:", headerText);
  
  // Verify main navbar / tab navigation is visible
  const bottomNav = page.locator("[data-testid='bottom-nav'], nav");
  await expect(bottomNav).toBeVisible();
  
  // Take screenshot of the initial state (disconnected/welcome screen)
  await page.screenshot({ path: "docs/assets/screen1.png" });
  console.log("Captured docs/assets/screen1.png");

  // Let's connect the mock wallet if possible or inspect the connect button
  const connectBtn = page.locator("button:has-text('Connect Wallet'), [data-testid='connect-wallet-btn']");
  await expect(connectBtn.first()).toBeVisible();

  // Click on the connect wallet button to trigger the bottom sheet/drawer
  await connectBtn.first().click();
  await page.waitForTimeout(1000);

  // Take screenshot of wallet connection picker modal
  await page.screenshot({ path: "docs/assets/screen2.png" });
  console.log("Captured docs/assets/screen2.png");

  // Let's click Freighter or Mock connection (if available) to connect
  const mockOption = page.locator("button:has-text('Sandbox Mode'), button:has-text('Freighter'), [data-testid='sandbox-connect']");
  if (await mockOption.count() > 0) {
    await mockOption.first().click();
    await page.waitForTimeout(1000);
    console.log("Clicked wallet connection option");
  } else {
    // If not found, close sheet or overlay
    const backdrop = page.locator("[data-testid='bottom-sheet-backdrop']");
    if (await backdrop.count() > 0) {
      await backdrop.first().click();
      await page.waitForTimeout(500);
    }
  }

  // Take screenshot of connected state
  await page.screenshot({ path: "docs/assets/screen3.png" });
  console.log("Captured docs/assets/screen3.png");

  // Navigate to Send tab if it's a tab interface (it should be on SendTab by default)
  // Let's switch to Escrow tab
  const escrowTabBtn = page.locator("button:has-text('Escrow'), [data-testid='tab-escrow']");
  if (await escrowTabBtn.count() > 0) {
    await escrowTabBtn.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "docs/assets/screen5.png" });
    console.log("Captured docs/assets/screen5.png");
  }

  // Switch to Activity tab
  const activityTabBtn = page.locator("button:has-text('Activity'), [data-testid='tab-activity']");
  if (await activityTabBtn.count() > 0) {
    await activityTabBtn.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "docs/assets/screen6.png" });
    console.log("Captured docs/assets/screen6.png");
  }

  // Switch to Settings tab
  const settingsTabBtn = page.locator("button:has-text('Settings'), [data-testid='tab-settings']");
  if (await settingsTabBtn.count() > 0) {
    await settingsTabBtn.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "docs/assets/screen5_settings.png" });
    console.log("Captured docs/assets/screen5_settings.png");
  }
});
