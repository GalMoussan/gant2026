import { CUSTOM_COLORS, SCHOOL_END, SCHOOL_START } from '../config/calendar.ts';
import type { CalendarEvent, CategoryKind } from '../types.ts';

export type EventKind = Extract<CategoryKind, 'special' | 'milestone' | 'holiday' | 'course' | 'custom'>;

export interface EventDraft {
  title: string;
  date: string;
  multiDay: boolean;
  endDate: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  kind: EventKind;
  courseCategoryId: string;
  color: string;
  location: string;
  notes: string;
  weekly: boolean;
  until: string;
  seriesScope: 'one' | 'series';
}

export type FieldName = 'title' | 'date' | 'endDate' | 'time' | 'category' | 'until' | 'notes';

export type FieldErrors = Partial<Record<FieldName, true>>;

export function emptyDraft(date: string): EventDraft {
  return {
    title: '',
    date,
    multiDay: false,
    endDate: date,
    allDay: true,
    startTime: '16:00',
    endTime: '18:00',
    kind: 'special',
    courseCategoryId: '',
    color: CUSTOM_COLORS[0],
    location: '',
    notes: '',
    weekly: false,
    until: date,
    seriesScope: 'one',
  };
}

export function validateDraft(draft: EventDraft): FieldErrors {
  const errors: FieldErrors = {};
  const title = draft.title.trim();
  if (title.length < 2 || title.length > 80) errors.title = true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) errors.date = true;
  if (draft.multiDay && draft.endDate < draft.date) errors.endDate = true;
  if (!draft.allDay && draft.endTime <= draft.startTime) errors.time = true;
  if (draft.kind === 'course' && !draft.courseCategoryId) errors.category = true;
  if (draft.kind === 'custom' && !draft.color) errors.category = true;
  if (draft.weekly && draft.until < draft.date) errors.until = true;
  if (draft.notes.length > 500) errors.notes = true;
  return errors;
}

export function firstError(errors: FieldErrors): FieldName | null {
  const order: FieldName[] = ['title', 'date', 'endDate', 'time', 'category', 'until', 'notes'];
  return order.find((field) => errors[field]) ?? null;
}

export function outsideSchoolYear(iso: string): boolean {
  return iso < SCHOOL_START || iso > SCHOOL_END;
}

export function categoryIdFor(draft: EventDraft): string {
  if (draft.kind === 'course') return draft.courseCategoryId;
  return draft.kind === 'custom' ? 'custom' : draft.kind;
}

const KINDS: readonly EventKind[] = ['special', 'milestone', 'holiday', 'course', 'custom'];

export function draftFromEvent(event: CalendarEvent, series: Array<{ date: string }>): EventDraft {
  const kind: EventKind = KINDS.includes(event.categoryId as EventKind) && event.categoryId !== 'course' ? (event.categoryId as EventKind) : 'course';
  const until = series.map((item) => item.date).sort().at(-1) ?? event.date;
  return {
    title: event.title,
    date: event.date,
    multiDay: Boolean(event.endDate && event.endDate > event.date),
    endDate: event.endDate ?? event.date,
    allDay: event.allDay || kind === 'holiday',
    startTime: event.startTime ?? '16:00',
    endTime: event.endTime ?? '18:00',
    kind,
    courseCategoryId: kind === 'course' ? event.categoryId : '',
    color: event.color ?? CUSTOM_COLORS[0],
    location: event.location ?? '',
    notes: event.notes ?? '',
    weekly: Boolean(event.recurrenceGroupId),
    until,
    seriesScope: 'one',
  };
}

export function parseDraft(value: unknown): EventDraft | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<EventDraft>;
  if (typeof raw.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) return null;
  if (typeof raw.title !== 'string') return null;
  const base = emptyDraft(raw.date);
  const kind = KINDS.includes(raw.kind as EventKind) ? (raw.kind as EventKind) : base.kind;
  return {
    ...base,
    title: raw.title,
    date: raw.date,
    multiDay: Boolean(raw.multiDay),
    endDate: typeof raw.endDate === 'string' ? raw.endDate : raw.date,
    allDay: raw.allDay !== false,
    startTime: typeof raw.startTime === 'string' ? raw.startTime : base.startTime,
    endTime: typeof raw.endTime === 'string' ? raw.endTime : base.endTime,
    kind,
    courseCategoryId: typeof raw.courseCategoryId === 'string' ? raw.courseCategoryId : '',
    color: typeof raw.color === 'string' ? raw.color : base.color,
    location: typeof raw.location === 'string' ? raw.location : '',
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    weekly: Boolean(raw.weekly),
    until: typeof raw.until === 'string' ? raw.until : raw.date,
    seriesScope: raw.seriesScope === 'series' ? 'series' : 'one',
  };
}
