import type { CalendarEvent } from '../types.ts';

export interface EventStore {
  list(): Promise<CalendarEvent[]>;
  add(event: CalendarEvent): Promise<void>;
  update(event: CalendarEvent): Promise<void>;
  remove(id: string): Promise<void>;
  subscribe(listener: (events: CalendarEvent[]) => void): () => void;
}
