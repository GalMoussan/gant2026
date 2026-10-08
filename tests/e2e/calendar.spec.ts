import { expect, test, type Page } from '@playwright/test';

const MONTHS = [
  '2026-10',
  '2026-11',
  '2026-12',
  '2027-01',
  '2027-02',
  '2027-03',
  '2027-04',
  '2027-05',
  '2027-06',
  '2027-07',
  '2027-08',
];

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
];

async function openMonth(page: Page, key: string) {
  await page.goto(`/?m=${key}`);
  await expect(page.locator('.month')).toHaveCount(11);
  await page.evaluate(() => document.fonts.ready);
  const section = page.locator(`#month-${key}`);
  await section.evaluate((element) => element.scrollIntoView({ block: 'start' }));
  return section;
}

test.describe('monthly calendar', () => {
  for (const viewport of VIEWPORTS) {
    test(`each month fits ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.locator('.month')).toHaveCount(11);
      const bar = await page.locator('.app-bar').evaluate((element) => element.getBoundingClientRect().height);
      expect(bar).toBe(56);
      for (const key of MONTHS) {
        const section = page.locator(`#month-${key}`);
        await section.evaluate((element) => element.scrollIntoView({ block: 'start' }));
        const metrics = await section.evaluate((element) => {
          const port = element.closest('.scrollport') as HTMLElement;
          return {
            section: element.clientHeight,
            port: port.clientHeight,
            overflow: element.scrollHeight - element.clientHeight,
          };
        });
        expect(Math.abs(metrics.section - metrics.port), `${key} ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(2);
        expect(metrics.overflow, `${key} overflow ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(1);
      }
    });
  }

  test('next, previous, and a month link', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openMonth(page, '2026-10');
    await page.locator('#month-2026-10').getByRole('button', { name: 'החודש הבא' }).click();
    await expect(page).toHaveURL(/m=2026-11/);
    await expect(page.locator('#month-2026-11')).toBeInViewport();
    await page.locator('#month-2026-11').getByRole('button', { name: 'החודש הקודם' }).click();
    await expect(page).toHaveURL(/m=2026-10/);
    await page.goto('/?m=2027-04');
    await expect(page.locator('#month-2027-04')).toBeInViewport();
    await expect(page.locator('#month-2027-04')).toContainText('פסח');
  });

  test('May collapses several milestones into one pill', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openMonth(page, '2027-05');
    await expect(page.locator('#month-2027-05').getByRole('button', { name: /אבני דרך/ })).toBeVisible();
  });

  test('the busiest day shows a more button at 1280×720', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await openMonth(page, '2027-01');
    await expect(page.locator('[data-date="2027-01-03"]').getByRole('button', { name: /נוספים/ })).toBeVisible();
  });

  test('an added event shows in December, survives reload, and can be undone', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/add?date=2026-12-15');
    await page.getByLabel('כותרת').fill('בדיקת דצמבר');
    await page.getByRole('button', { name: 'שמירת אירוע' }).click();
    await expect(page).toHaveURL(/m=2026-12/);
    const cell = page.locator('[data-date="2026-12-15"]');
    await expect(cell).toContainText('בדיקת דצמבר');
    await cell.locator('.day-num').click();
    await expect(page.getByRole('dialog')).toContainText('בדיקת דצמבר');
    await page.keyboard.press('Escape');
    await page.reload();
    await expect(page.locator('[data-date="2026-12-15"]')).toContainText('בדיקת דצמבר');

    await page.goto('/add?date=2026-12-16');
    await page.getByLabel('כותרת').fill('לביטול');
    await page.getByRole('button', { name: 'שמירת אירוע' }).click();
    await page.getByRole('button', { name: 'בטל' }).click();
    await expect(page.locator('[data-date="2026-12-16"]')).not.toContainText('לביטול');
  });

  test('an added event appears in another tab', async ({ page, context }) => {
    const other = await context.newPage();
    await other.goto('/');
    await expect(other.locator('.month')).toHaveCount(11);
    await page.goto('/add?date=2026-12-20');
    await page.getByLabel('כותרת').fill('סנכרון טאב');
    await page.getByRole('button', { name: 'שמירת אירוע' }).click();
    await expect(other.locator('[data-date="2026-12-20"]')).toContainText('סנכרון טאב');
    await other.close();
  });
});

test('screenshots of the marked months', async ({ page }) => {
  const shots = [
    { key: '2026-10', file: '2026-10' },
    { key: '2026-12', file: '2026-12' },
    { key: '2027-04', file: '2027-04' },
  ];
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const shot of shots) {
      await openMonth(page, shot.key);
      await page.screenshot({
        path: `tests/e2e/screenshots/${shot.file}-${viewport.width}x${viewport.height}.png`,
      });
    }
  }
});
