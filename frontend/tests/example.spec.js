import { test, expect } from '@playwright/test';

test('homepage shows title and demo notes', async ({ page }) => {
  await page.goto(process.env.FRONTEND_TEST_URL || 'http://localhost:4173');
  await expect(page.locator('h1')).toHaveText('Mentor Platform');
  // if demo notes are present, ensure list renders
  const list = page.locator('ul');
  if (await list.count() > 0) {
    await expect(list).toBeVisible();
  }
});
