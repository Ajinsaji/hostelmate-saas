# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> Public Hostel Registration Flow
- Location: tests\auth.spec.js:26:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/register
Call log:
  - navigating to "http://localhost:5173/register", waiting until "load"

```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test('Super Admin Login Flow', async ({ page }) => {
  4  |   await page.goto('/login');
  5  |   
  6  |   // Test invalid login
  7  |   await page.fill('input[type="email"]', 'invalid@hostelmate.com');
  8  |   await page.fill('input[type="password"]', 'wrongpassword');
  9  |   await page.click('button[type="submit"]');
  10 |   
  11 |   await expect(page.locator('text=Invalid')).toBeVisible({ timeout: 5000 });
  12 | 
  13 |   // Test successful login
  14 |   await page.fill('input[type="email"]', 'superadmin@hostelmate.com');
  15 |   await page.fill('input[type="password"]', 'SuperAdmin@123');
  16 |   await page.click('button[type="submit"]');
  17 | 
  18 |   // Verify redirect to dashboard
  19 |   await expect(page).toHaveURL(/\/dashboard|^\/$/);
  20 |   
  21 |   // Test logout
  22 |   await page.click('button:has-text("Logout")');
  23 |   await expect(page).toHaveURL('/login');
  24 | });
  25 | 
  26 | test('Public Hostel Registration Flow', async ({ page }) => {
> 27 |   await page.goto('/register');
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/register
  28 |   
  29 |   await page.fill('input[name="ownerName"]', 'Test Owner');
  30 |   await page.fill('input[name="email"]', 'testowner@example.com');
  31 |   await page.fill('input[name="phone"]', '1234567890');
  32 |   await page.fill('input[name="hostelName"]', 'Test Hostel');
  33 |   await page.fill('input[name="password"]', 'Password@123');
  34 |   
  35 |   await page.click('button[type="submit"]');
  36 |   
  37 |   await expect(page.locator('text=registration successful')).toBeVisible({ timeout: 5000 });
  38 | });
```