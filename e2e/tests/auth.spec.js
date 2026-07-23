const { test, expect } = require('@playwright/test');

test('Super Admin Login Flow', async ({ page }) => {
  await page.goto('/login');
  
  // Test invalid login
  await page.fill('input[type="email"]', 'invalid@hostelmate.com');
  await page.fill('input[type="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=Invalid')).toBeVisible({ timeout: 5000 });

  // Test successful login
  await page.fill('input[type="email"]', 'superadmin@hostelmate.com');
  await page.fill('input[type="password"]', 'SuperAdmin@123');
  await page.click('button[type="submit"]');

  // Verify redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard|^\/$/);
  
  // Test logout
  await page.click('button:has-text("Logout")');
  await expect(page).toHaveURL('/login');
});

test('Public Hostel Registration Flow', async ({ page }) => {
  await page.goto('/register');
  
  await page.fill('input[name="ownerName"]', 'Test Owner');
  await page.fill('input[name="email"]', 'testowner@example.com');
  await page.fill('input[name="phone"]', '1234567890');
  await page.fill('input[name="hostelName"]', 'Test Hostel');
  await page.fill('input[name="password"]', 'Password@123');
  
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=registration successful')).toBeVisible({ timeout: 5000 });
});