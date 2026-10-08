import type { SupabaseClient } from '@supabase/supabase-js';
import type { CalendarEvent } from '../types.ts';
import type { EventStore } from './eventStore.ts';
import { eventToRow, rowToEvent, type EventRow } from './eventRow.ts';
import { StoreError } from './storeError.ts';

/**
 * Shared events in Supabase. Realtime refetches the list, and a tab that
 * returns to the foreground refetches too, so a dropped socket cannot leave
 * a stale board on screen.
 */
export function createSupabaseEventStore(client: SupabaseClient): EventStore {
  let events: CalendarEvent[] = [];
  const listeners = new Set<(next: CalendarEvent[]) => void>();

  const snapshot = (): CalendarEvent[] => events.map((event) => ({ ...event }));

  const emit = (): void => {
    const next = snapshot();
    listeners.forEach((listener) => listener(next));
  };

  async function reload(): Promise<void> {
    const { data, error } = await client.from('events').select('*').order('date');
    if (error) return;
    events = (data as EventRow[]).map(rowToEvent);
    emit();
  }

  return {
    async list() {
      const { data, error } = await client.from('events').select('*').order('date');
      if (error) throw new StoreError();
      events = (data as EventRow[]).map(rowToEvent);
      return snapshot();
    },
    async add(event) {
      const { error } = await client.from('events').insert(eventToRow(event));
      if (error) throw new StoreError();
      events = [...events.filter((item) => item.id !== event.id), { ...event }];
      emit();
    },
    async update(event) {
      const { error } = await client.from('events').update(eventToRow(event)).eq('id', event.id);
      if (error) throw new StoreError();
      events = events.map((item) => (item.id === event.id ? { ...event } : item));
      emit();
    },
    async remove(id) {
      const { error } = await client.from('events').delete().eq('id', id);
      if (error) throw new StoreError();
      events = events.filter((item) => item.id !== id);
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      let timer = 0;
      const schedule = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          void reload();
        }, 120);
      };
      const onVisible = () => {
        if (document.visibilityState === 'visible') schedule();
      };
      document.addEventListener('visibilitychange', onVisible);
      const channel = client
        .channel(`events-${crypto.randomUUID()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, schedule)
        .subscribe((status) => {
          if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') schedule();
        });
      return () => {
        listeners.delete(listener);
        window.clearTimeout(timer);
        document.removeEventListener('visibilitychange', onVisible);
        void client.removeChannel(channel);
      };
    },
  };
}
