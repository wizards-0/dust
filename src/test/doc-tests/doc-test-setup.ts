import { test as setup } from '@playwright/test';
import path from 'path';

const setupStateFile = path.join(__dirname, './state/default.json');

setup('Initialize settings', async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto('/');
  await page.locator('button#settingsRouteButton').click();
  await page.locator('mat-radio-button[value="dark"]').click();
  await page.locator('input#proxyUrlInput').fill('http://localhost:3040');
  await page.locator('button#homeRouteButton').click();
  await page.context().storageState({ path: setupStateFile });
});