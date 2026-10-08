import { describe, expect, it } from 'vitest';
import type { CalendarEvent } from '../types.ts';
import { createMemoryEventStore } from '../store/memoryEventStore.ts';
import { expandWeekly } from './events.ts';
import { emptyDraft, validateDraft } from './form.ts';

function sample(): CalendarEvent {
  return {
    id: 'u1',
    title: 'שיחה',
    date: '2026-12-15',
    allDay: true,
    categoryId: 'special',
    source: 'user',
  };
}

describe('memory event store', () => {
  it('adds, updates, removes, and notifies subscribers', async () => {
    const store = createMemoryEventStore();
    const seen: number[] = [];
    store.subscribe((events) => seen.push(events.length));
    await store.add(sample());
    await store.update({ ...sample(), title: 'שיחה חדשה' });
    expect((await store.list())[0]?.title).toBe('שיחה חדשה');
    await store.remove('u1');
    expect(await store.list()).toEqual([]);
    expect(seen).toEqual([1, 1, 0]);
  });
});

describe('validateDraft', () => {
  it('requires a title of at least two characters', () => {
    const draft = emptyDraft('2026-12-15');
    draft.title = 'א';
    expect(validateDraft(draft).title).toBe(true);
  });

  it('rejects an end time that is not after the start', () => {
    const draft = emptyDraft('2026-12-15');
    draft.title = 'סדנה';
    draft.allDay = false;
    draft.startTime = '18:00';
    draft.endTime = '18:00';
    expect(validateDraft(draft).time).toBe(true);
  });
});

describe('expandWeekly', () => {
  it('creates one event per week through the until date', () => {
    let n = 0;
    const events = expandWeekly(
      { title: 'חוג', allDay: true, categoryId: 'special', source: 'user' },
      '2026-10-05',
      '2026-10-19',
      undefined,
      'group-1',
      () => `id-${n++}`,
    );
    expect(events.map((event) => event.date)).toEqual(['2026-10-05', '2026-10-12', '2026-10-19']);
    expect(events.every((event) => event.recurrenceGroupId === 'group-1')).toBe(true);
  });
});
