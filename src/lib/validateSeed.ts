import type { SeedData } from '../types.ts';
import { EXPECTED, EXPECTED_HOLIDAYS, EXPECTED_MONTHS } from './expected.ts';

export interface ValidationIssue {
  field: string;
  actual: string;
  expected: string;
}

export interface SeedTally {
  courses: number;
  holidays: number;
  specials: number;
  distinctDays: number;
  busiestDays: number;
  firstEntry: string;
  lastEntry: string;
  milestoneMonths: number;
  usedCategories: number;
}

export function tallySeed(seed: SeedData): SeedTally {
  const courseIds = new Set(seed.categories.filter((category) => category.kind === 'course').map((c) => c.id));
  const byDay = new Map<string, number>();
  let courses = 0;
  let holidays = 0;
  let specials = 0;
  const used = new Set<string>();
  for (const event of seed.events) {
    byDay.set(event.date, (byDay.get(event.date) ?? 0) + 1);
    if (courseIds.has(event.categoryId)) {
      courses += 1;
      used.add(event.categoryId);
    } else if (event.categoryId === 'holiday') holidays += 1;
    else if (event.categoryId === 'special') specials += 1;
  }
  const days = [...byDay.keys()].sort();
  return {
    courses,
    holidays,
    specials,
    distinctDays: byDay.size,
    busiestDays: [...byDay.values()].filter((count) => count === EXPECTED.busiest).length,
    firstEntry: days[0] ?? '',
    lastEntry: days[days.length - 1] ?? '',
    milestoneMonths: seed.months.filter((month) => month.milestones.length > 0).length,
    usedCategories: used.size,
  };
}

function issue(field: string, actual: string | number, expected: string | number): ValidationIssue {
  return { field, actual: String(actual), expected: String(expected) };
}

export function validateSeed(seed: SeedData): ValidationIssue[] {
  const tally = tallySeed(seed);
  const issues: ValidationIssue[] = [];
  const keys = seed.months.map((month) => month.key);
  if (keys.join(',') !== EXPECTED_MONTHS.join(',')) {
    issues.push(issue('months', keys.join(','), EXPECTED_MONTHS.join(',')));
  }
  if (seed.events.length !== EXPECTED.entries) issues.push(issue('entries', seed.events.length, EXPECTED.entries));
  if (tally.courses !== EXPECTED.courses) issues.push(issue('courses', tally.courses, EXPECTED.courses));
  if (tally.usedCategories !== EXPECTED.categories) {
    issues.push(issue('categories', tally.usedCategories, EXPECTED.categories));
  }
  if (tally.holidays !== EXPECTED.holidays) issues.push(issue('holidays', tally.holidays, EXPECTED.holidays));
  if (tally.specials !== EXPECTED.specials) issues.push(issue('specials', tally.specials, EXPECTED.specials));
  if (tally.distinctDays !== EXPECTED.distinctDays) {
    issues.push(issue('distinctDays', tally.distinctDays, EXPECTED.distinctDays));
  }
  if (tally.busiestDays !== EXPECTED.busiestDays) {
    issues.push(issue('busiestDays', tally.busiestDays, EXPECTED.busiestDays));
  }
  if (tally.firstEntry !== EXPECTED.firstEntry) issues.push(issue('firstEntry', tally.firstEntry, EXPECTED.firstEntry));
  if (tally.lastEntry !== EXPECTED.lastEntry) issues.push(issue('lastEntry', tally.lastEntry, EXPECTED.lastEntry));
  if (tally.milestoneMonths !== EXPECTED.milestoneMonths) {
    issues.push(issue('milestoneMonths', tally.milestoneMonths, EXPECTED.milestoneMonths));
  }

  for (const [name, expected] of Object.entries(EXPECTED_HOLIDAYS)) {
    const dates = seed.events
      .filter((event) => event.categoryId === 'holiday' && event.title === name)
      .map((event) => event.date)
      .sort();
    const from = dates[0] ?? '';
    const to = dates[dates.length - 1] ?? '';
    if (dates.length !== expected.count || from !== expected.from || to !== expected.to) {
      issues.push(
        issue(name, `${dates.length} ${from}..${to}`, `${expected.count} ${expected.from}..${expected.to}`),
      );
    }
  }

  const robotics = seed.events.find((event) => event.date === '2026-10-26' && event.categoryId === 'special');
  if (
    !robotics ||
    robotics.title !== 'רובוכיף' ||
    robotics.startTime !== '16:30' ||
    robotics.endTime !== '19:00' ||
    robotics.allDay
  ) {
    issues.push(issue('robochef', robotics?.title ?? 'missing', 'רובוכיף 16:30-19:00'));
  }
  const staff = seed.events.find((event) => event.date === '2026-10-28' && event.categoryId === 'special');
  if (!staff || staff.title !== 'ערב לצוותים החינוכיים' || !staff.allDay) {
    issues.push(issue('staffEvening', staff?.title ?? 'missing', 'ערב לצוותים החינוכיים'));
  }
  return issues;
}

export function formatReport(seed: SeedData, issues: ValidationIssue[]): string {
  const tally = tallySeed(seed);
  const lines = [
    'לוח שנה תשפ״ז — דוח ייבוא',
    `חודשים: ${seed.months.length} (צפוי ${EXPECTED.months})`,
    `רשומות: ${seed.events.length} (צפוי ${EXPECTED.entries})`,
    `מפגשי קורסים: ${tally.courses} (צפוי ${EXPECTED.courses})`,
    `קטגוריות בשימוש: ${tally.usedCategories} (צפוי ${EXPECTED.categories})`,
    `ימי חג: ${tally.holidays} (צפוי ${EXPECTED.holidays})`,
    `אירועים מיוחדים: ${tally.specials} (צפוי ${EXPECTED.specials})`,
    `ימים עם רשומה: ${tally.distinctDays} (צפוי ${EXPECTED.distinctDays})`,
    `ימים עם ${EXPECTED.busiest} רשומות: ${tally.busiestDays} (צפוי ${EXPECTED.busiestDays})`,
    `רשומה ראשונה: ${tally.firstEntry} (צפוי ${EXPECTED.firstEntry})`,
    `רשומה אחרונה: ${tally.lastEntry} (צפוי ${EXPECTED.lastEntry})`,
    `חודשים עם אבני דרך: ${tally.milestoneMonths} (צפוי ${EXPECTED.milestoneMonths})`,
  ];
  if (issues.length === 0) {
    lines.push('IMPORT OK');
  } else {
    for (const item of issues) {
      lines.push(`FAIL ${item.field}: actual ${item.actual} expected ${item.expected}`);
    }
    lines.push('IMPORT FAILED');
  }
  return lines.join('\n');
}
