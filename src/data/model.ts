import { formatHebrew } from '../lib/hebrew.ts';
import type { Category, SeedData } from '../types.ts';
import seedJson from './seed.json' with { type: 'json' };

export const seed = seedJson as unknown as SeedData;

export const categoryMap: Map<string, Category> = new Map(seed.categories.map((category) => [category.id, category]));

export const courseCategories = seed.categories.filter((category) => category.kind === 'course');

export const excelEvents = seed.events;

const hebrewByDate: Record<string, string> = {};
for (const month of seed.months) {
  Object.assign(hebrewByDate, month.hebrewDates);
}

export function hebrewFor(iso: string): string {
  return hebrewByDate[iso] ?? formatHebrew(iso);
}

export function initialMonth(search: string, today: string): string {
  const requested = new URLSearchParams(search).get('m');
  const keys = new Set(seed.months.map((month) => month.key));
  if (requested && keys.has(requested)) return requested;
  const current = today.slice(0, 7);
  if (keys.has(current)) return current;
  return seed.months[0]?.key ?? '2026-10';
}

export function adjacentMonth(key: string, delta: number): string | null {
  const keys = seed.months.map((month) => month.key);
  const index = keys.indexOf(key);
  if (index < 0) return null;
  return keys[index + delta] ?? null;
}

export function monthByKey(key: string) {
  return seed.months.find((month) => month.key === key) ?? null;
}
