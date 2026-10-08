import { addDays, format, parseISO } from 'date-fns';

const GREGORIAN_MONTHS: Record<string, number> = {
  ינואר: 1,
  פברואר: 2,
  מרץ: 3,
  אפריל: 4,
  מאי: 5,
  יוני: 6,
  יולי: 7,
  אוגוסט: 8,
  ספטמבר: 9,
  אוקטובר: 10,
  נובמבר: 11,
  דצמבר: 12,
};

/** Excel 1900 date system, including the fake 1900-02-29 leap day. Serial 46296 is 2026-10-01. */
export function excelSerialToIso(serial: number): string {
  const days = Math.round(serial);
  const ms = Date.UTC(1899, 11, 30) + days * 86_400_000;
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function gregorianMonthKey(title: string): string {
  const match = title.trim().match(/^(\S+)\s+(\d{4})$/);
  if (!match) {
    throw new Error(`Unrecognized month title: ${title}`);
  }
  const monthName = match[1] ?? '';
  const year = match[2] ?? '';
  const month = GREGORIAN_MONTHS[monthName];
  if (!month) {
    throw new Error(`Unrecognized Gregorian month: ${monthName}`);
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function addIsoDays(iso: string, days: number): string {
  return format(addDays(parseISO(iso), days), 'yyyy-MM-dd');
}

export function todayIso(now = new Date()): string {
  return format(now, 'yyyy-MM-dd');
}

export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

export function weekdayIndex(iso: string): number {
  return parseISO(iso).getDay();
}

export function dayNumber(iso: string): number {
  return Number(iso.slice(8, 10));
}

export function formatDotDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${Number(day)}.${Number(month)}.${year}`;
}

export interface CalendarDay {
  iso: string;
  inMonth: boolean;
}

export function monthWeeks(key: string): CalendarDay[][] {
  const [yearText, monthText] = key.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const first = new Date(year, month - 1, 1);
  const cursor = new Date(year, month - 1, 1 - first.getDay());
  const lastIso = format(new Date(year, month, 0), 'yyyy-MM-dd');
  const weeks: CalendarDay[][] = [];
  while (weeks.length < 6) {
    const week: CalendarDay[] = [];
    for (let index = 0; index < 7; index += 1) {
      const iso = format(cursor, 'yyyy-MM-dd');
      week.push({ iso, inMonth: cursor.getMonth() === month - 1 });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (week.some((day) => day.iso === lastIso)) break;
  }
  return weeks;
}

export function eachDate(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addIsoDays(cursor, 1);
    if (dates.length > 400) break;
  }
  return dates;
}

export function weeklyDates(start: string, until: string, limit: string): string[] {
  const end = until < limit ? until : limit;
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end && dates.length < 60) {
    dates.push(cursor);
    cursor = addIsoDays(cursor, 7);
  }
  return dates;
}

export function shiftIso(iso: string, deltaDays: number): string {
  return addIsoDays(iso, deltaDays);
}

export function daysBetween(start: string, end: string): number {
  const a = parseISO(start).getTime();
  const b = parseISO(end).getTime();
  return Math.round((b - a) / 86_400_000);
}
