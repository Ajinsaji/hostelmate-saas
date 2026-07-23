# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Backup Verification
- Location: tests\dashboard.spec.js:24:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
  - navigating to "http://localhost:5173/login", waiting until "load"

```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test.beforeEach(async ({ page }) => {
  4  |   // Login before each dashboard test
> 5  |   await page.goto('/login');
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
  6  |   await page.fill('input[type="email"]', 'superadmin@hostelmate.com');
  7  |   await page.fill('input[type="password"]', 'SuperAdmin@123');
  8  |   await page.click('button[type="submit"]');
  9  |   await expect(page).toHaveURL(/\/dashboard|^\/$/);
  10 | });
  11 | 
  12 | test('Super Admin Dashboard Navigation and Statistics', async ({ page }) => {
  13 |   // Test navigation to various sections
  14 |   await page.click('text=Hostels');
  15 |   await expect(page.locator('h1', { hasText: 'Hostels Directory' }).first()).toBeVisible({ timeout: 5000 });
  16 |   
  17 |   await page.click('text=Residents');
  18 |   await expect(page.locator('h1', { hasText: 'Residents Directory' }).first()).toBeVisible({ timeout: 5000 });
  19 | 
  20 |   await page.click('text=Reports');
  21 |   await expect(page.locator('h1', { hasText: 'Platform Reports' }).first()).toBeVisible({ timeout: 5000 });
  22 | });
  23 | 
  24 | test('Backup Verification', async ({ page }) => {
  25 |   await page.click('text=Settings');
  26 |   
  27 |   // Navigate to backup or trigger backup logic (this depends on the exact UI, assuming a 'Backup' button exists)
  28 |   const backupButton = page.locator('button', { hasText: 'Run Backup' }).first();
  29 |   if (await backupButton.isVisible()) {
  30 |     await backupButton.click();
  31 |     await expect(page.locator('text=Backup successful')).toBeVisible({ timeout: 10000 });
  32 |   }
  33 | });
```