# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.js >> Validation Rejects Invalid Login
- Location: tests\security.spec.js:3:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 404
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test('Validation Rejects Invalid Login', async ({ request }) => {
  4  |   const response = await request.post('/api/auth/login', {
  5  |     data: {
  6  |       email: 'not-an-email',
  7  |       password: ''
  8  |     }
  9  |   });
  10 | 
> 11 |   expect(response.status()).toBe(400);
     |                             ^ Error: expect(received).toBe(expected) // Object.is equality
  12 |   
  13 |   const body = await response.json();
  14 |   expect(body.success).toBe(false);
  15 |   expect(body.errors).toBeDefined();
  16 |   
  17 |   // Verify error format
  18 |   expect(body.errors[0].field).toBe('email');
  19 | });
  20 | 
  21 | test('Rate Limiting Blocks Excessive Requests', async ({ request }) => {
  22 |   // We cannot easily trigger rate limiting in a fast test without hitting the limit,
  23 |   // but we can ensure standard requests work.
  24 |   const response = await request.get('/api/health');
  25 |   expect(response.status()).toBe(200);
  26 | });
  27 | 
  28 | test('Error Boundary catches React exceptions', async ({ page }) => {
  29 |   // Normally we would navigate to a known broken route or trigger an error to test the boundary.
  30 |   // For the sake of the E2E test, we just assume the boundary is present in the DOM layout if a crash happens.
  31 |   await page.goto('/login');
  32 |   await expect(page.locator('form')).toBeVisible();
  33 | });
```