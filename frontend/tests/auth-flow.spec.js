import { test, expect } from '@playwright/test';

const BASE_URL = process.env.FRONTEND_TEST_URL || 'http://localhost:5173';

test.describe('Auth Flow E2E', () => {
  test('complete auth flow: register → login → dashboard', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e_test_${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'E2E Test User';

    // Step 1: Navigate to register page
    await page.goto(`${BASE_URL}/register`);
    await expect(page).toHaveTitle('Mentor Platform');

    // Step 2: Fill registration form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[type="password"]', testPassword);
    
    // Select MENTEE role
    await page.selectOption('select', 'MENTEE');

    // Submit registration
    await page.click('button[type="submit"]');

    // Step 3: Wait for success message
    await expect(page.locator('.success')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.success')).toContainText(/successful/i);

    // Step 4: Should auto-redirect to login after 2 seconds
    await page.waitForURL(/\/login/, { timeout: 5000 });
    
    // Step 5: Login with the new user
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Step 6: Verify we're logged in - should be on dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    console.log(`✅ E2E Test Passed: User ${testEmail} registered and logged in successfully`);
  });

  test('login with existing user', async ({ page }) => {
    // Use a known test user
    const existingEmail = 'testuser_20251224_222019@example.com';
    const existingPassword = 'TestPassword123!';

    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveTitle('Mentor Platform');

    await page.fill('input[type="email"]', existingEmail);
    await page.fill('input[type="password"]', existingPassword);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    console.log(`✅ Login Test Passed: User ${existingEmail} logged in successfully`);
  });
});
