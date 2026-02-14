import { test, expect } from '@playwright/test';

test('Package center index label should align with yellow highlight box center', async ({ page }) => {
  // Load the app
  await page.goto('http://localhost:4200');
  
  // Wait for app to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Wait for axis-highlight (yellow box) to appear
  const yellowBox = page.locator('.axis-highlight').first();
  await yellowBox.waitFor({ state: 'visible', timeout: 5000 });
  
  // Get the yellow box's position
  const yellowBoxBBox = await yellowBox.boundingBox();
  if (!yellowBoxBBox) {
    throw new Error('Yellow box not found');
  }
  
  const yellowBoxCenterX = yellowBoxBBox.x + yellowBoxBBox.width / 2;
  
  // Get the label position
  const label = page.locator('.axis-label-with-connector').first();
  await label.waitFor({ state: 'visible', timeout: 5000 });
  
  const labelBBox = await label.boundingBox();
  if (!labelBBox) {
    throw new Error('Label not found');
  }
  
  const labelCenterX = labelBBox.x + labelBBox.width / 2;
  
  // Labels should be within 10px tolerance of the yellow box center
  const tolerance = 10;
  const difference = Math.abs(yellowBoxCenterX - labelCenterX);
  
  console.log(`Yellow box center X: ${yellowBoxCenterX}`);
  console.log(`Label center X: ${labelCenterX}`);
  console.log(`Difference: ${difference}px`);
  
  if (difference > tolerance) {
    // Take screenshot for debugging
    await page.screenshot({ path: 'label-misaligned.png' });
    throw new Error(`Label is misaligned by ${difference}px. Expected within ${tolerance}px`);
  }
  
  // Take success screenshot
  await page.screenshot({ path: 'label-aligned-correct.png' });
  expect(difference).toBeLessThanOrEqual(tolerance);
});
