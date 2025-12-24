import { test, expect } from '@playwright/test';

test('homepage redirects to dashboard or login', async ({ page }) => {
  await page.goto(process.env.FRONTEND_TEST_URL || 'http://localhost:5173');
  
  // Should redirect to either login or dashboard
  await page.waitForURL(/\/(login|dashboard)/, { timeout: 5000 });
  
  // Verify page title
  await expect(page).toHaveTitle('Mentor Platform');
});
