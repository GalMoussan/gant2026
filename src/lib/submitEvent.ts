import { SCHOOL_END } from '../config/calendar.ts';
import type { CalendarEvent } from '../types.ts';
import { addIsoDays, daysBetween, weeklyDates } from './dates.ts';
import { categoryIdFor, type EventDraft } from './form.ts';

export interface SubmissionPlan {
  upserts: CalendarEvent[];
  removeIds: string[];
}

function sharedFields(draft: EventDraft, now: string): Omit<CalendarEvent, 'id' | 'date' | 'endDate' | 'recurrenceGroupId' | 'createdAt'> {
  const holiday = draft.kind === 'holiday';
  const allDay = holiday || draft.allDay;
  return {
    title: draft.title.trim(),
    allDay,
    startTime: allDay ? undefined : draft.startTime,
    endTime: allDay ? undefined : draft.endTime,
    categoryId: categoryIdFor(draft),
    location: draft.location.trim() || undefined,
    notes: draft.notes.trim() || undefined,
    color: draft.kind === 'custom' ? draft.color : undefined,
    source: 'user',
    updatedAt: now,
  };
}

function withSpan(date: string, span: number): string | undefined {
  return span > 0 ? addIsoDays(date, span) : undefined;
}

export function planSubmission(
  draft: EventDraft,
  existing: CalendarEvent | null,
  series: CalendarEvent[],
  makeId: () => string,
  now: string,
): SubmissionPlan {
  const fields = sharedFields(draft, now);
  const span = draft.multiDay ? Math.max(0, daysBetween(draft.date, draft.endDate)) : 0;

  if (!existing) {
    if (!draft.weekly) {
      return {
        upserts: [
          {
            ...fields,
            id: makeId(),
            date: draft.date,
            endDate: withSpan(draft.date, span),
            createdAt: now,
          },
        ],
        removeIds: [],
      };
    }
    const groupId = makeId();
    const upserts = weeklyDates(draft.date, draft.until, SCHOOL_END).map((date) => ({
      ...fields,
      id: makeId(),
      date,
      endDate: withSpan(date, span),
      recurrenceGroupId: groupId,
      createdAt: now,
    }));
    return { upserts, removeIds: [] };
  }

  if (existing.recurrenceGroupId && draft.seriesScope === 'series') {
    const delta = daysBetween(existing.date, draft.date);
    const groupId = existing.recurrenceGroupId;
    const shifted = series.map((item) => {
      const date = addIsoDays(item.date, delta);
      return {
        ...item,
        ...fields,
        id: item.id,
        date,
        endDate: withSpan(date, span),
        recurrenceGroupId: groupId,
        createdAt: item.createdAt,
      };
    });
    if (!draft.weekly) return { upserts: shifted, removeIds: [] };
    const removeIds = shifted.filter((item) => item.date > draft.until).map((item) => item.id);
    const kept = shifted.filter((item) => item.date <= draft.until);
    const have = new Set(kept.map((item) => item.date));
    const extras = weeklyDates(draft.date, draft.until, SCHOOL_END)
      .filter((date) => !have.has(date))
      .map((date) => ({
        ...fields,
        id: makeId(),
        date,
        endDate: withSpan(date, span),
        recurrenceGroupId: groupId,
        createdAt: now,
      }));
    return { upserts: [...kept, ...extras], removeIds };
  }

  const updated: CalendarEvent = {
    ...existing,
    ...fields,
    date: draft.date,
    endDate: withSpan(draft.date, span),
    createdAt: existing.createdAt,
  };
  if (draft.weekly && !existing.recurrenceGroupId) {
    const groupId = makeId();
    updated.recurrenceGroupId = groupId;
    const rest = weeklyDates(draft.date, draft.until, SCHOOL_END)
      .filter((date) => date !== draft.date)
      .map((date) => ({
        ...fields,
        id: makeId(),
        date,
        endDate: withSpan(date, span),
        recurrenceGroupId: groupId,
        createdAt: now,
      }));
    return { upserts: [updated, ...rest], removeIds: [] };
  }
  return { upserts: [updated], removeIds: [] };
}
