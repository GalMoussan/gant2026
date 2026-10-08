export type CategoryKind = 'course' | 'holiday' | 'special' | 'milestone' | 'custom';

export type CategoryGroup = 'schools' | 'center';

export interface Category {
  id: string;
  name: string;
  rawLabel?: string;
  group?: CategoryGroup;
  groups?: number;
  weeklyHoursPerGroup?: number;
  color: string;
  kind: CategoryKind;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  categoryId: string;
  location?: string;
  notes?: string;
  color?: string;
  source: 'excel' | 'user';
  recurrenceGroupId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MonthMeta {
  key: string;
  title: string;
  hebrewRange: string;
  milestones: string[];
  hebrewDates: Record<string, string>;
}

export interface SeedData {
  categories: Category[];
  months: MonthMeta[];
  events: CalendarEvent[];
}

export interface SheetGrid {
  get(col: number, row: number): string | number | null;
  maxRow: number;
}
