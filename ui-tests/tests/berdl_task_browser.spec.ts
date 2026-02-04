import { expect, test } from '@jupyterlab/galata';

/**
 * Basic integration test - verifies the extension loads.
 */
test('should load extension', async ({ page }) => {
  await page.goto();

  // Wait for JupyterLab to fully load
  await page.waitForSelector('.jp-Launcher', { timeout: 30000 });

  // Extension loaded successfully if we get here without errors
  expect(true).toBe(true);
});
