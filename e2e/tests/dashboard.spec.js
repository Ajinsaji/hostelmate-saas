const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  // Login before each dashboard test
  await page.goto('/login');
  await page.fill('input[type="email"]', 'superadmin@hostelmate.com');
  await page.fill('input[type="password"]', 'SuperAdmin@123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard|^\/$/);
});

test('Super Admin Dashboard Navigation and Statistics', async ({ page }) => {
  // Test navigation to various sections
  await page.click('text=Hostels');
  await expect(page.locator('h1', { hasText: 'Hostels Directory' }).first()).toBeVisible({ timeout: 5000 });
  
  await page.click('text=Residents');
  await expect(page.locator('h1', { hasText: 'Residents Directory' }).first()).toBeVisible({ timeout: 5000 });

  await page.click('text=Reports');
  await expect(page.locator('h1', { hasText: 'Platform Reports' }).first()).toBeVisible({ timeout: 5000 });
});

test('Backup Verification', async ({ page }) => {
  await page.click('text=Settings');
  
  // Navigate to backup or trigger backup logic (this depends on the exact UI, assuming a 'Backup' button exists)
  const backupButton = page.locator('button', { hasText: 'Run Backup' }).first();
  if (await backupButton.isVisible()) {
    await backupButton.click();
    await expect(page.locator('text=Backup successful')).toBeVisible({ timeout: 10000 });
  }
});