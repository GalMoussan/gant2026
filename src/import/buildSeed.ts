import { CELL_COLORS, SYSTEM_CATEGORIES } from '../config/calendar.ts';
import { parseLegend, parseSpecial } from '../lib/categories.ts';
import { excelSerialToIso, gregorianMonthKey } from '../lib/dates.ts';
import { parseMilestones } from '../lib/milestones.ts';
import type { CalendarEvent, Category, CategoryGroup, MonthMeta, SeedData, SheetGrid } from '../types.ts';

const DAY_COLS = [1, 3, 5, 7, 9, 11, 13];
const SERIAL_COLS = [16, 17, 18, 19, 20, 21, 22];

function colLetter(col: number): string {
  let value = col;
  let letters = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    value = Math.floor((value - 1) / 26);
  }
  return letters;
}

function text(grid: SheetGrid, col: number, row: number): string | null {
  const value = grid.get(col, row);
  if (typeof value !== 'string') return null;
  return value.trim() ? value : null;
}

function isMonthTitle(value: string | null): value is string {
  return Boolean(value && value.includes('|') && /20\d\d/.test(value));
}

function findMonthRows(grid: SheetGrid): number[] {
  const rows: number[] = [];
  for (let row = 1; row <= grid.maxRow; row += 1) {
    const value = text(grid, 1, row);
    if (isMonthTitle(value)) rows.push(row);
  }
  return rows;
}

function findLegendRows(grid: SheetGrid): number[] {
  const rows: number[] = [];
  for (let row = 1; row <= 15; row += 1) {
    for (let col = 1; col <= 14; col += 1) {
      const value = text(grid, col, row);
      if (value && parseLegend(value.trim())) {
        rows.push(row);
        break;
      }
    }
  }
  return rows;
}

function findHolidayNames(grid: SheetGrid): string[] {
  let column = 24;
  for (let col = 1; col <= 30; col += 1) {
    for (let row = 1; row <= 6; row += 1) {
      const value = text(grid, col, row);
      if (value?.includes('חופשות')) column = col;
    }
  }
  const names: string[] = [];
  for (let row = 1; row <= 30; row += 1) {
    const value = text(grid, column, row)?.trim();
    if (!value || value.includes('חופש')) continue;
    names.push(value);
  }
  return names;
}

function readCategories(grid: SheetGrid): { categories: Category[]; byRaw: Map<string, Category> } {
  const legendRows = findLegendRows(grid);
  const schoolsRow = legendRows[0];
  const centerRow = legendRows[1];
  if (!schoolsRow || !centerRow) {
    throw new Error('Could not find the two legend rows');
  }
  const categories: Category[] = [];
  const byRaw = new Map<string, Category>();
  const rows: Array<[number, CategoryGroup]> = [
    [schoolsRow, 'schools'],
    [centerRow, 'center'],
  ];
  for (const [row, group] of rows) {
    for (let col = 1; col <= 14; col += 1) {
      const raw = text(grid, col, row);
      if (!raw) continue;
      const parsed = parseLegend(raw.trim());
      if (!parsed) throw new Error(`Legend cell ${colLetter(col)}${row} did not match the hours pattern`);
      const id = `${colLetter(col)}${row}`;
      const color = CELL_COLORS[id];
      if (!color) throw new Error(`Missing color for ${id}`);
      const category: Category = {
        id,
        name: parsed.name,
        rawLabel: raw.trim(),
        group,
        groups: parsed.groups,
        weeklyHoursPerGroup: parsed.weeklyHoursPerGroup,
        color,
        kind: 'course',
      };
      categories.push(category);
      byRaw.set(raw.trim(), category);
    }
  }
  categories.push(...SYSTEM_CATEGORIES);
  return { categories, byRaw };
}

function structural(value: string | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.includes('|') || trimmed === 'ראשון' || trimmed.startsWith('★');
}

export function buildSeed(grid: SheetGrid): SeedData {
  const { categories, byRaw } = readCategories(grid);
  const holidays = new Set(findHolidayNames(grid));
  const monthRows = findMonthRows(grid);
  const months: MonthMeta[] = [];
  const events: CalendarEvent[] = [];
  const sequence = new Map<string, number>();

  monthRows.forEach((start, index) => {
    const end = (monthRows[index + 1] ?? start + 80) - 1;
    const titleCell = text(grid, 1, start);
    if (!isMonthTitle(titleCell)) return;
    const [gregorian, hebrew] = titleCell.split('|').map((part) => part.trim());
    const key = gregorianMonthKey(gregorian ?? '');
    let milestones: string[] = [];
    let headerRow: number | null = null;
    for (let row = start + 1; row <= Math.min(start + 8, end); row += 1) {
      const value = text(grid, 1, row)?.trim() ?? '';
      if (value.startsWith('★')) milestones = parseMilestones(value);
      if (value === 'ראשון') headerRow = row;
    }
    if (headerRow === null) throw new Error(`Month ${key} has no weekday header`);

    const hebrewDates: Record<string, string> = {};
    let row = headerRow + 1;
    while (row <= end) {
      const serials = SERIAL_COLS.map((col) => grid.get(col, row));
      const hasSerial = serials.some((value) => typeof value === 'number');
      if (!hasSerial) {
        row += 1;
        continue;
      }
      const dates = serials.map((value) => (typeof value === 'number' ? excelSerialToIso(value) : null));
      DAY_COLS.forEach((col, dayIndex) => {
        const iso = dates[dayIndex];
        if (!iso) return;
        const label = text(grid, col, row);
        if (label?.includes('·')) {
          hebrewDates[iso] = label.split('·')[1]?.trim().replace(/\s+/g, ' ') ?? '';
        }
      });

      let entryRow = row + 1;
      while (entryRow <= end) {
        const nextSerial = SERIAL_COLS.some((col) => typeof grid.get(col, entryRow) === 'number');
        const lead = text(grid, 1, entryRow);
        if (nextSerial || structural(lead)) break;
        for (let dayIndex = 0; dayIndex < DAY_COLS.length; dayIndex += 1) {
          const iso = dates[dayIndex];
          if (!iso) continue;
          const dayCol = DAY_COLS[dayIndex] ?? 1;
          for (const offset of [0, 1]) {
            const raw = text(grid, dayCol + offset, entryRow);
            if (!raw) continue;
            const trimmed = raw.trim();
            const course = byRaw.get(trimmed);
            let categoryId = 'special';
            let title = trimmed;
            let allDay = true;
            let startTime: string | undefined;
            let endTime: string | undefined;
            if (course) {
              categoryId = course.id;
              title = course.name;
            } else if (holidays.has(trimmed)) {
              categoryId = 'holiday';
              title = trimmed;
            } else {
              const special = parseSpecial(trimmed);
              title = special.title;
              allDay = special.allDay;
              startTime = special.startTime;
              endTime = special.endTime;
            }
            const seqKey = `${iso}:${categoryId}:${title}`;
            const next = (sequence.get(seqKey) ?? 0) + 1;
            sequence.set(seqKey, next);
            const event: CalendarEvent = {
              id: `xlsx:${iso}:${categoryId}:${next}`,
              title,
              date: iso,
              allDay,
              categoryId,
              source: 'excel',
            };
            if (startTime) event.startTime = startTime;
            if (endTime) event.endTime = endTime;
            events.push(event);
          }
        }
        entryRow += 1;
      }
      row = entryRow;
    }

    months.push({
      key,
      title: gregorian ?? '',
      hebrewRange: hebrew ?? '',
      milestones,
      hebrewDates,
    });
  });

  return { categories, months, events };
}
