import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildSeed } from '../src/import/buildSeed.ts';
import { validateSeed } from '../src/lib/validateSeed.ts';
import { loadScheduleGrid } from './excelGrid.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('schedule.xlsx', () => {
  it('matches the published validation numbers', async () => {
    const seed = buildSeed(await loadScheduleGrid(path.join(root, 'data', 'schedule.xlsx')));
    expect(validateSeed(seed)).toEqual([]);
  });

  it('keeps the source file as an xlsx archive', () => {
    const saved = readFileSync(path.join(root, 'data', 'schedule.xlsx'));
    expect(saved.byteLength).toBeGreaterThan(80_000);
    expect(saved.subarray(0, 2).toString()).toBe('PK');
  });

  it('stores the Excel Hebrew date and legend fields', async () => {
    const seed = buildSeed(await loadScheduleGrid(path.join(root, 'data', 'schedule.xlsx')));
    expect(seed.months[0]?.hebrewDates['2026-10-01']).toBe('20 תשרי');
    expect(seed.categories.find((category) => category.id === 'A4')).toMatchObject({
      groups: 3,
      weeklyHoursPerGroup: 3,
      color: '#F4B183',
    });
    expect(seed.categories.find((category) => category.id === 'J5')?.name).toBe('נבחרת אנגלית (דיבייט, TED)');
  });
});
