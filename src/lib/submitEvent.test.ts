import { describe, expect, it } from 'vitest';
import type { CalendarEvent } from '../types.ts';
import { emptyDraft } from './form.ts';
import { planSubmission } from './submitEvent.ts';

function ids(): () => string {
  let n = 0;
  return () => `id-${n++}`;
}

describe('planSubmission', () => {
  it('creates a single event', () => {
    const draft = emptyDraft('2026-12-15');
    draft.title = 'הרצאה';
    const plan = planSubmission(draft, null, [], ids(), '2026-10-08T00:00:00.000Z');
    expect(plan.removeIds).toEqual([]);
    expect(plan.upserts).toHaveLength(1);
    expect(plan.upserts[0]).toMatchObject({ title: 'הרצאה', date: '2026-12-15', source: 'user', allDay: true });
  });

  it('repeats weekly through the until date', () => {
    const draft = emptyDraft('2026-10-05');
    draft.title = 'חוג';
    draft.weekly = true;
    draft.until = '2026-10-19';
    const plan = planSubmission(draft, null, [], ids(), '2026-10-08T00:00:00.000Z');
    expect(plan.upserts.map((event) => event.date)).toEqual(['2026-10-05', '2026-10-12', '2026-10-19']);
    expect(new Set(plan.upserts.map((event) => event.recurrenceGroupId)).size).toBe(1);
  });

  it('shifts a whole series when that scope is chosen', () => {
    const draft = emptyDraft('2026-10-12');
    draft.title = 'חוג חדש';
    draft.seriesScope = 'series';
    draft.weekly = true;
    draft.until = '2026-10-26';
    const existing: CalendarEvent = {
      id: 'a',
      title: 'חוג',
      date: '2026-10-05',
      allDay: true,
      categoryId: 'special',
      source: 'user',
      recurrenceGroupId: 'g',
    };
    const series = [existing, { ...existing, id: 'b', date: '2026-10-12' }, { ...existing, id: 'c', date: '2026-10-19' }];
    const plan = planSubmission(draft, existing, series, ids(), '2026-10-08T00:00:00.000Z');
    expect(plan.upserts.map((event) => event.date).sort()).toEqual(['2026-10-12', '2026-10-19', '2026-10-26']);
    expect(plan.upserts.every((event) => event.title === 'חוג חדש')).toBe(true);
  });

  it('keeps every shifted date when weekly is turned off', () => {
    const draft = emptyDraft('2026-10-12');
    draft.title = 'חוג חדש';
    draft.seriesScope = 'series';
    draft.weekly = false;
    draft.until = '2026-10-12';
    const existing: CalendarEvent = {
      id: 'a',
      title: 'חוג',
      date: '2026-10-05',
      allDay: true,
      categoryId: 'special',
      source: 'user',
      recurrenceGroupId: 'g',
    };
    const series = [existing, { ...existing, id: 'b', date: '2026-10-12' }, { ...existing, id: 'c', date: '2026-10-19' }];
    const plan = planSubmission(draft, existing, series, ids(), '2026-10-08T00:00:00.000Z');
    expect(plan.removeIds).toEqual([]);
    expect(plan.upserts.map((event) => event.date).sort()).toEqual(['2026-10-12', '2026-10-19', '2026-10-26']);
  });
});
