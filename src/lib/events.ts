import { SCHOOL_END } from '../config/calendar.ts';
import type { CalendarEvent, Category } from '../types.ts';
import { addIsoDays, daysBetween, weeklyDates } from './dates.ts';

export interface Filters {
  hiddenCategoryIds: string[];
  mineOnly: boolean;
  showHolidays: boolean;
  query: string;
}

export const DEFAULT_FILTERS: Filters = {
  hiddenCategoryIds: [],
  mineOnly: false,
  showHolidays: true,
  query: '',
};

export function eventCovers(event: CalendarEvent, iso: string): boolean {
  const end = event.endDate ?? event.date;
  return iso >= event.date && iso <= end;
}

export function isHoliday(event: CalendarEvent, categories: Map<string, Category>): boolean {
  return categories.get(event.categoryId)?.kind === 'holiday';
}

export function passesFilter(
  event: CalendarEvent,
  filters: Filters,
  categories: Map<string, Category>,
): boolean {
  const holiday = isHoliday(event, categories);
  if (holiday) {
    if (!filters.showHolidays) return false;
    if (filters.mineOnly && event.source !== 'user') return false;
    return true;
  }
  if (filters.mineOnly && event.source !== 'user') return false;
  if (filters.hiddenCategoryIds.includes(event.categoryId)) return false;
  return true;
}

export function matchesQuery(event: CalendarEvent, query: string): boolean {
  const needle = query.trim();
  if (!needle) return true;
  const haystack = `${event.title} ${event.location ?? ''} ${event.notes ?? ''}`;
  return haystack.includes(needle);
}

export function compareEvents(
  a: CalendarEvent,
  b: CalendarEvent,
  categories: Map<string, Category>,
): number {
  const rank = (event: CalendarEvent): number => {
    const kind = categories.get(event.categoryId)?.kind;
    if (kind === 'holiday') return 0;
    if (event.source === 'excel' && kind === 'special') return 1;
    if (event.source === 'user') return 2;
    return 3;
  };
  const rankDelta = rank(a) - rank(b);
  if (rankDelta !== 0) return rankDelta;
  if (a.startTime && b.startTime && a.startTime !== b.startTime) {
    return a.startTime < b.startTime ? -1 : 1;
  }
  if (a.startTime && !b.startTime) return -1;
  if (!a.startTime && b.startTime) return 1;
  const order = (event: CalendarEvent): number => {
    const index = [...categories.keys()].indexOf(event.categoryId);
    return index === -1 ? 999 : index;
  };
  const orderDelta = order(a) - order(b);
  if (orderDelta !== 0) return orderDelta;
  return a.title.localeCompare(b.title, 'he');
}

export function eventsOnDay(
  events: CalendarEvent[],
  iso: string,
  categories: Map<string, Category>,
  filters?: Filters,
): CalendarEvent[] {
  return events
    .filter((event) => eventCovers(event, iso))
    .filter((event) => (filters ? passesFilter(event, filters, categories) : true))
    .sort((a, b) => compareEvents(a, b, categories));
}

export type SpanRole = 'single' | 'start' | 'middle' | 'end';

export function holidayRoles(titles: Array<string | null>): Array<SpanRole | null> {
  const roles: Array<SpanRole | null> = titles.map(() => null);
  let index = 0;
  while (index < titles.length) {
    const title = titles[index];
    if (!title) {
      index += 1;
      continue;
    }
    let end = index;
    while (end + 1 < titles.length && titles[end + 1] === title) end += 1;
    if (index === end) {
      roles[index] = 'single';
    } else {
      roles[index] = 'start';
      for (let cursor = index + 1; cursor < end; cursor += 1) roles[cursor] = 'middle';
      roles[end] = 'end';
    }
    index = end + 1;
  }
  return roles;
}

export function holidayTitleOn(
  events: CalendarEvent[],
  categories: Map<string, Category>,
): string | null {
  const holiday = events.find((event) => isHoliday(event, categories));
  return holiday?.title ?? null;
}

export function chipEvents(events: CalendarEvent[], categories: Map<string, Category>): CalendarEvent[] {
  return events.filter((event) => !isHoliday(event, categories));
}

export function expandWeekly(
  base: Omit<CalendarEvent, 'id' | 'date' | 'endDate' | 'recurrenceGroupId'>,
  start: string,
  until: string,
  endDate: string | undefined,
  groupId: string,
  makeId: () => string,
): CalendarEvent[] {
  const span = endDate ? Math.max(0, daysBetween(start, endDate)) : 0;
  return weeklyDates(start, until, SCHOOL_END).map((date) => {
    const event: CalendarEvent = {
      ...base,
      id: makeId(),
      date,
      recurrenceGroupId: groupId,
    };
    if (span > 0) event.endDate = addIsoDays(date, span);
    return event;
  });
}

export function isUserEvent(value: unknown): value is CalendarEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event.id === 'string' &&
    event.id.length > 0 &&
    typeof event.title === 'string' &&
    typeof event.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(event.date) &&
    typeof event.allDay === 'boolean' &&
    typeof event.categoryId === 'string' &&
    event.source === 'user'
  );
}

export function parseBackup(text: string): CalendarEvent[] | null {
  try {
    const data: unknown = JSON.parse(text);
    const events = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && Array.isArray((data as { events?: unknown }).events)
        ? (data as { events: unknown[] }).events
        : null;
    if (!events) return null;
    const parsed: CalendarEvent[] = [];
    for (const item of events) {
      if (!isUserEvent(item)) return null;
      parsed.push(item);
    }
    return parsed;
  } catch {
    return null;
  }
}
