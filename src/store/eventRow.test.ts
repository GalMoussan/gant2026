import { describe, expect, it } from 'vitest';
import type { CalendarEvent } from '../types.ts';
import { eventToRow, rowToEvent } from './eventRow.ts';
import { StoreError } from './storeError.ts';

const event: CalendarEvent = {
  id: 'user:1',
  title: 'הרצאה',
  date: '2026-12-15',
  endDate: '2026-12-16',
  allDay: false,
  startTime: '16:00',
  endTime: '18:00',
  categoryId: 'special',
  location: 'אולם',
  notes: 'להביא דפים',
  color: '#0F766E',
  source: 'user',
  recurrenceGroupId: 'group-1',
  createdAt: '2026-10-08T00:00:00.000Z',
  updatedAt: '2026-10-08T01:00:00.000Z',
};

describe('event rows', () => {
  it('maps a user event to a database row and back', () => {
    const row = eventToRow(event);
    expect(row).toMatchObject({
      id: 'user:1',
      end_date: '2026-12-16',
      start_time: '16:00',
      category_id: 'special',
      source: 'user',
      recurrence_group_id: 'group-1',
    });
    expect(rowToEvent(row)).toEqual(event);
  });

  it('drops the clock time of an all-day event', () => {
    const row = eventToRow({ ...event, allDay: true });
    expect(row.start_time).toBeNull();
    expect(row.end_time).toBeNull();
  });

  it('refuses an excel row', () => {
    expect(() => eventToRow({ ...event, id: 'xlsx:2026-12-15:a:0', source: 'excel' })).toThrow(StoreError);
  });
});
