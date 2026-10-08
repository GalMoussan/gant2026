import { create } from 'zustand';
import { FILTERS_STORAGE_KEY } from '../config/calendar.ts';
import { DEFAULT_FILTERS, type Filters } from '../lib/events.ts';
import type { CalendarEvent } from '../types.ts';
import { eventStore } from './instance.ts';

export interface ToastAction {
  label: string;
  run: () => void;
}

interface ToastModel {
  id: number;
  message: string;
  actions: ToastAction[];
}

interface CalendarState {
  userEvents: CalendarEvent[];
  ready: boolean;
  filters: Filters;
  toast: ToastModel | null;
  init: () => () => void;
  setFilters: (filters: Filters) => void;
  showToast: (message: string, actions?: ToastAction[]) => void;
  dismissToast: () => void;
  addUserEvents: (events: CalendarEvent[]) => Promise<void>;
  updateUserEvent: (event: CalendarEvent) => Promise<void>;
  removeUserEvents: (ids: string[]) => Promise<void>;
  importUserEvents: (events: CalendarEvent[]) => Promise<number>;
}

function loadFilters(): Filters {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw) as Partial<Filters>;
    return {
      hiddenCategoryIds: Array.isArray(parsed.hiddenCategoryIds)
        ? parsed.hiddenCategoryIds.filter((id): id is string => typeof id === 'string')
        : [],
      mineOnly: Boolean(parsed.mineOnly),
      showHolidays: parsed.showHolidays !== false,
      query: typeof parsed.query === 'string' ? parsed.query : '',
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

let toastSeq = 0;

export const useCalendar = create<CalendarState>((set, get) => ({
  userEvents: [],
  ready: false,
  filters: loadFilters(),
  toast: null,
  init: () => {
    let cancel = false;
    void eventStore.list().then((events) => {
      if (!cancel) set({ userEvents: events, ready: true });
    });
    const unsubscribe = eventStore.subscribe((events) => {
      if (!cancel) set({ userEvents: events, ready: true });
    });
    return () => {
      cancel = true;
      unsubscribe();
    };
  },
  setFilters: (filters) => {
    set({ filters });
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch {
      /* storage unavailable */
    }
  },
  showToast: (message, actions = []) => {
    toastSeq += 1;
    set({ toast: { id: toastSeq, message, actions } });
  },
  dismissToast: () => set({ toast: null }),
  addUserEvents: async (events) => {
    for (const event of events) await eventStore.add(event);
  },
  updateUserEvent: async (event) => {
    await eventStore.update(event);
  },
  removeUserEvents: async (ids) => {
    for (const id of ids) await eventStore.remove(id);
  },
  importUserEvents: async (events) => {
    const have = new Set(get().userEvents.map((event) => event.id));
    const fresh = events.filter((event) => !have.has(event.id));
    for (const event of fresh) await eventStore.add(event);
    return fresh.length;
  },
}));
