import { expect, test } from '@playwright/test';

test('unsigned visitors see only the sign-in gate', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'כניסה ללוח' })).toBeVisible();
  await expect(page.getByLabel('אימייל')).toBeVisible();
  await expect(page.getByLabel('סיסמה')).toBeVisible();
  await expect(page.getByText('חשבון חדש נפתח על ידי מנהל הלוח.')).toBeVisible();
  await expect(page.locator('.month')).toHaveCount(0);
  await expect(page.locator('.app-bar')).toHaveCount(0);
  await page.screenshot({ path: 'tests/e2e/screenshots/sign-in-1440x900.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'כניסה ללוח' })).toBeVisible();
  await page.screenshot({ path: 'tests/e2e/screenshots/sign-in-390x844.png' });
});

test('an empty sign-in asks for both fields', async ({ page }) => {
  await page.goto('/add');
  await page.getByRole('button', { name: 'כניסה' }).click();
  await expect(page.getByRole('alert')).toHaveText('יש להזין אימייל וסיסמה');
  await expect(page.locator('.month')).toHaveCount(0);
});

test('a refused sign-in stays on the gate', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('אימייל').fill('staff@example.com');
  await page.getByLabel('סיסמה').fill('not-a-real-password');
  await page.getByRole('button', { name: 'כניסה' }).click();
  await expect(page.getByRole('alert')).toHaveText('לא הצלחנו להתחבר. נסו שוב');
  await expect(page.locator('.month')).toHaveCount(0);
  await expect(page.locator('.app-bar')).toHaveCount(0);
});
