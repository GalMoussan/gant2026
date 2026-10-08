import type { Category } from '../types.ts';

/** Rename these two labels in one place. They are the legend group headings. */
export const GROUP_LABELS = {
  schools: 'תכניות בבתי ספר',
  center: 'קורסים ונבחרות במרכז',
} as const;

export const SCHOOL_START = '2026-10-01';
export const SCHOOL_END = '2027-08-31';

export const HOLIDAY_COLOR = '#BFBFBF';
export const SPECIAL_COLOR = '#1F4E78';
export const MILESTONE_BG = '#FFF2CC';
export const MILESTONE_TEXT = '#7A5B00';
export const CHIP_TEXT = '#1F2937';

/** Colors come from the brief, keyed by cell address. The workbook has no fills. */
export const CELL_COLORS: Record<string, string> = {
  A4: '#F4B183',
  B4: '#A9D08E',
  C4: '#9BC2E6',
  D4: '#FFD966',
  E4: '#C9A0DC',
  F4: '#F8CBAD',
  G4: '#8EA9DB',
  H4: '#B4DE9C',
  I4: '#FF9999',
  J4: '#99E6E6',
  K4: '#E6B8AF',
  L4: '#D5A6BD',
  M4: '#B6D7A8',
  N4: '#FFE599',
  A5: '#A4C2F4',
  B5: '#F9CB9C',
  C5: '#93C47D',
  D5: '#76A5AF',
  E5: '#E06666',
  F5: '#6FA8DC',
  G5: '#FFB3DE',
  H5: '#C27BA0',
  I5: '#8FD6B8',
  J5: '#D9C27A',
  K5: '#BCA9F5',
};

/** Ten swatches that do not collide with the course colors or holiday grey. */
export const CUSTOM_COLORS = [
  '#0F766E',
  '#9A3412',
  '#6D28D9',
  '#9F1239',
  '#B45309',
  '#1E293B',
  '#0369A1',
  '#A16207',
  '#3F6212',
  '#831843',
] as const;

export const SYSTEM_CATEGORIES: Category[] = [
  { id: 'holiday', name: 'חג / חופשה', color: HOLIDAY_COLOR, kind: 'holiday' },
  { id: 'special', name: 'אירוע מיוחד', color: SPECIAL_COLOR, kind: 'special' },
  { id: 'milestone', name: 'אבן דרך', color: MILESTONE_BG, kind: 'milestone' },
  { id: 'custom', name: 'אחר', color: CUSTOM_COLORS[0], kind: 'custom' },
];

export const EVENTS_STORAGE_KEY = 'luach-tashpaz-events-v1';
export const EVENTS_CHANNEL = 'luach-tashpaz';
export const FILTERS_STORAGE_KEY = 'luach-tashpaz-filters';
export const DRAFT_STORAGE_KEY = 'luach-tashpaz-draft';
