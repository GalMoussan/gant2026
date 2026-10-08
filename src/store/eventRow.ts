import type { CalendarEvent } from '../types.ts';
import { StoreError } from './storeError.ts';

export interface EventRow {
  id: string;
  title: string;
  date: string;
  end_date: string | null;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  category_id: string;
  location: string | null;
  notes: string | null;
  color: string | null;
  source: 'user';
  recurrence_group_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function eventToRow(event: CalendarEvent): EventRow {
  if (event.source !== 'user' || event.id.startsWith('xlsx:')) throw new StoreError();
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    end_date: event.endDate ?? null,
    all_day: event.allDay,
    start_time: event.allDay ? null : (event.startTime ?? null),
    end_time: event.allDay ? null : (event.endTime ?? null),
    category_id: event.categoryId,
    location: event.location ?? null,
    notes: event.notes ?? null,
    color: event.color ?? null,
    source: 'user',
    recurrence_group_id: event.recurrenceGroupId ?? null,
    created_at: event.createdAt ?? null,
    updated_at: event.updatedAt ?? null,
  };
}

export function rowToEvent(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    endDate: row.end_date ?? undefined,
    allDay: row.all_day,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    categoryId: row.category_id,
    location: row.location ?? undefined,
    notes: row.notes ?? undefined,
    color: row.color ?? undefined,
    source: 'user',
    recurrenceGroupId: row.recurrence_group_id ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}
