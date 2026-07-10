import { test, expect } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
});

test("Verify AI Assist accordion height transitions and absence of hover/tap scale effects", async ({ page }) => {
  // 1. Navigate to the local dev server
  await page.goto("http://localhost:3000");
  await page.waitForLoadState("networkidle");

  // 2. Connect the wallet using Sandbox mode to reveal SendTab and AI Assist container
  const connectBtn = page.locator("button:has-text('Connect Wallet'), [data-testid='connect-wallet-btn']");
  await expect(connectBtn.first()).toBeVisible();
  await connectBtn.first().click();
  await page.waitForTimeout(500);

  const sandboxBtn = page.locator("[data-testid='wallet-option-mock']");
  await expect(sandboxBtn).toBeVisible();
  await sandboxBtn.click();
  await page.waitForTimeout(1000); // Wait for connection sequence

  // 3. Locate AI Assist container
  const aiStrip = page.locator("[data-testid='ai-smart-strip']");
  await expect(aiStrip).toBeVisible();

  // Verify initial state is collapsed
  const expandBtn = aiStrip.locator("button").first();
  const toggleSpan = expandBtn.locator("span:has-text('Expand'), span:has-text('Collapse')");
  await expect(toggleSpan).toHaveText("Expand");

  // Get initial collapsed height of the container
  const initialBox = await aiStrip.boundingBox();
  expect(initialBox).not.toBeNull();
  const collapsedHeight = initialBox!.height;
  console.log(`Collapsed height: ${collapsedHeight}px`);

  // Take screenshot of collapsed state
  await page.screenshot({ path: "test-results/screenshots/ai_assist_collapsed.png" });
  console.log("Captured test-results/screenshots/ai_assist_collapsed.png");

  // 4. Click Expand and measure heights during transition to verify smooth animation
  console.log("Expanding AI Assist...");
  await expandBtn.click();

  // Capture heights during transition (e.g. at 50ms, 100ms, 150ms, 250ms)
  const transitionHeights: number[] = [];
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(50);
    const box = await aiStrip.boundingBox();
    if (box) {
      transitionHeights.push(box.height);
    }
  }

  // Verify final expanded height
  const expandedBox = await aiStrip.boundingBox();
  expect(expandedBox).not.toBeNull();
  const expandedHeight = expandedBox!.height;
  console.log(`Expanded height: ${expandedHeight}px`);
  console.log("Transition height sampling:", transitionHeights);

  // Height must increase smoothly, i.e., final expanded height is greater than collapsed height,
  // and we sampled heights intermediate to them.
  expect(expandedHeight).toBeGreaterThan(collapsedHeight);
  // Ensure we saw at least one intermediate height during the animation transition
  const distinctHeights = Array.from(new Set(transitionHeights));
  expect(distinctHeights.length).toBeGreaterThan(1);
  console.log("Accordion height transitions smoothly!");

  // Take screenshot of expanded state
  await page.screenshot({ path: "test-results/screenshots/ai_assist_expanded.png" });
  console.log("Captured test-results/screenshots/ai_assist_expanded.png");

  // 5. Verify NO hover/tap scale effects on 'Collapse' / 'Expand' span
  const toggleSpanClass = await toggleSpan.getAttribute("class");
  console.log("Toggle span classes:", toggleSpanClass);
  // Check that the class does not contain hover:scale or active:scale or animate-bounce/float classes
  expect(toggleSpanClass).not.toContain("scale");
  expect(toggleSpanClass).not.toContain("hover:scale");
  expect(toggleSpanClass).not.toContain("active:scale");

  // Verify NO hover/tap scale effects on the 'Parse Command' button
  const parseBtn = aiStrip.locator("button:has-text('Parse Command')");
  await expect(parseBtn).toBeVisible();
  const parseBtnClass = await parseBtn.getAttribute("class");
  console.log("Parse Command button classes:", parseBtnClass);
  expect(parseBtnClass).not.toContain("scale");
  expect(parseBtnClass).not.toContain("hover:scale");
  expect(parseBtnClass).not.toContain("active:scale");

  // 6. Click Collapse and verify it shrinks back smoothly
  console.log("Collapsing AI Assist...");
  await expandBtn.click();
  await page.waitForTimeout(450); // wait for exit animation to complete

  const finalBox = await aiStrip.boundingBox();
  expect(finalBox).not.toBeNull();
  console.log(`Final collapsed height: ${finalBox!.height}px`);
  expect(finalBox!.height).toBeCloseTo(collapsedHeight, 1);
});
