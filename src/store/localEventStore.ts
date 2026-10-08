import { get, set } from 'idb-keyval';
import { EVENTS_CHANNEL, EVENTS_STORAGE_KEY } from '../config/calendar.ts';
import type { CalendarEvent } from '../types.ts';
import type { EventStore } from './eventStore.ts';

/**
 * IndexedDB via idb-keyval, with an in-memory fallback when storage is unavailable.
 * A later SupabaseEventStore can implement EventStore without UI changes.
 */
export function createLocalEventStore(): EventStore {
  let events: CalendarEvent[] = [];
  let memoryOnly = false;
  let loaded: Promise<void> | null = null;
  let queue: Promise<void> = Promise.resolve();
  const listeners = new Set<(next: CalendarEvent[]) => void>();
  let channel: BroadcastChannel | null = null;

  const snapshot = (): CalendarEvent[] => events.map((event) => ({ ...event }));

  const emit = (): void => {
    const next = snapshot();
    listeners.forEach((listener) => listener(next));
  };

  const enqueue = (work: () => Promise<void>): Promise<void> => {
    const run = queue.then(work, work);
    queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };

  async function load(): Promise<void> {
    try {
      const stored = await get<CalendarEvent[]>(EVENTS_STORAGE_KEY);
      events = Array.isArray(stored) ? stored.map((event) => ({ ...event })) : [];
    } catch {
      memoryOnly = true;
      events = [];
    }
  }

  function ready(): Promise<void> {
    loaded ??= load();
    return loaded;
  }

  try {
    channel = new BroadcastChannel(EVENTS_CHANNEL);
    channel.onmessage = () => {
      loaded = null;
      void ready().then(emit);
    };
  } catch {
    channel = null;
  }

  async function save(): Promise<void> {
    if (memoryOnly) return;
    try {
      await set(EVENTS_STORAGE_KEY, events);
      channel?.postMessage({ type: 'changed' });
    } catch {
      memoryOnly = true;
    }
  }

  return {
    list() {
      return enqueue(async () => {
        await ready();
      }).then(snapshot);
    },
    add(event) {
      return enqueue(async () => {
        await ready();
        events = [...events, { ...event }];
        await save();
        emit();
      });
    },
    update(event) {
      return enqueue(async () => {
        await ready();
        events = events.map((item) => (item.id === event.id ? { ...event } : item));
        await save();
        emit();
      });
    },
    remove(id) {
      return enqueue(async () => {
        await ready();
        events = events.filter((item) => item.id !== id);
        await save();
        emit();
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
