export const EXPECTED_MONTHS = [
  '2026-10',
  '2026-11',
  '2026-12',
  '2027-01',
  '2027-02',
  '2027-03',
  '2027-04',
  '2027-05',
  '2027-06',
  '2027-07',
  '2027-08',
] as const;

export const EXPECTED_HOLIDAYS: Record<string, { count: number; from: string; to: string }> = {
  פסח: { count: 16, from: '2027-04-13', to: '2027-04-28' },
  חנוכה: { count: 7, from: '2026-12-06', to: '2026-12-12' },
  פורים: { count: 2, from: '2027-03-23', to: '2027-03-24' },
  שבועות: { count: 2, from: '2027-06-10', to: '2027-06-11' },
  'יום העצמאות': { count: 1, from: '2027-05-12', to: '2027-05-12' },
  'ל"ג בעומר': { count: 1, from: '2027-05-25', to: '2027-05-25' },
};

export const EXPECTED = {
  months: 11,
  entries: 719,
  courses: 688,
  categories: 25,
  holidays: 29,
  specials: 2,
  distinctDays: 196,
  busiest: 14,
  busiestDays: 24,
  firstEntry: '2026-10-05',
  lastEntry: '2027-06-30',
  milestoneMonths: 8,
} as const;
