import type { CalendarEvent } from '../types.ts';
import type { EventStore } from './eventStore.ts';

export function createMemoryEventStore(initial: CalendarEvent[] = []): EventStore {
  let events = initial.map((event) => ({ ...event }));
  const listeners = new Set<(next: CalendarEvent[]) => void>();

  const emit = (): void => {
    const snapshot = events.map((event) => ({ ...event }));
    listeners.forEach((listener) => listener(snapshot));
  };

  return {
    async list() {
      return events.map((event) => ({ ...event }));
    },
    async add(event) {
      events = [...events, { ...event }];
      emit();
    },
    async update(event) {
      events = events.map((item) => (item.id === event.id ? { ...event } : item));
      emit();
    },
    async remove(id) {
      events = events.filter((item) => item.id !== id);
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
