import { expect, test } from '@playwright/test';

test('a new event keeps its start and end time', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/add?date=2026-12-15');
  await page.getByLabel('כותרת').fill('סדנת זמנים');
  await page.getByRole('radio', { name: 'הוספת שעות' }).click();
  await page.getByLabel('שעת התחלה').selectOption('17:00');
  await page.getByLabel('שעת סיום').selectOption('19:15');
  await expect(page.locator('.preview-desktop .preview-chip')).toContainText('17:00–19:15');
  await page.getByRole('button', { name: 'שמירת אירוע' }).click();

  const chip = page.getByRole('button', { name: /סדנת זמנים/ });
  await expect(chip).toContainText('17:00–19:15');
  await chip.click();
  await expect(page.locator('.popover')).toContainText('17:00–19:15');

  await page.getByRole('link', { name: 'עריכה' }).click();
  await expect(page.getByRole('radio', { name: 'הוספת שעות' })).toHaveAttribute('data-state', 'on');
  await page.getByLabel('שעת סיום').selectOption('20:00');
  await page.getByRole('button', { name: 'שמירת שינויים' }).click();
  const updated = page.getByRole('button', { name: /סדנת זמנים/ });
  await expect(updated).toContainText('17:00–20:00');

  await page.locator('[data-date="2026-12-15"] .day-num').click();
  await expect(page.locator('.day-panel')).toContainText('סדנת זמנים');
  await expect(page.locator('.day-panel')).toContainText('17:00–20:00');
});

test('an event saved without times stays all day', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/add?date=2026-12-16');
  await page.getByLabel('כותרת').fill('יום שלם');
  await expect(page.getByRole('radio', { name: 'כל היום' })).toHaveAttribute('data-state', 'on');
  await expect(page.getByLabel('שעת התחלה')).toHaveCount(0);
  await page.getByRole('button', { name: 'שמירת אירוע' }).click();
  const chip = page.getByRole('button', { name: 'יום שלם' });
  await expect(chip).toBeVisible();
  await expect(chip).not.toContainText('16:00');
});
