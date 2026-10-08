import { describe, expect, it } from 'vitest';
import { CELL_COLORS, CHIP_TEXT } from '../config/calendar.ts';
import { parseLegend, parseSpecial } from './categories.ts';
import { contrastRatio, tint } from './color.ts';
import { addIsoDays, excelSerialToIso, monthWeeks } from './dates.ts';
import { chooseDensity } from './density.ts';
import { holidayRoles } from './events.ts';
import { formatHebrew } from './hebrew.ts';
import { parseMilestones } from './milestones.ts';

describe('parseLegend', () => {
  it('reads the last groups-times-hours parenthetical', () => {
    const parsed = parseLegend("נבחרת אנגלית (דיבייט, TED) (1×2 ש')");
    expect(parsed).toEqual({ name: 'נבחרת אנגלית (דיבייט, TED)', groups: 1, weeklyHoursPerGroup: 2 });
  });

  it('returns null when the hours pattern is missing', () => {
    expect(parseLegend('פייתון')).toBeNull();
  });
});

describe('excel serials', () => {
  it('converts serial 46296 to 2026-10-01', () => {
    expect(excelSerialToIso(46296)).toBe('2026-10-01');
  });

  it('rounds float serials', () => {
    expect(excelSerialToIso(46296.2)).toBe('2026-10-01');
  });
});

describe('parseSpecial', () => {
  it('pulls a Hebrew time range out of the title', () => {
    expect(parseSpecial('★ רובוכיף בין 16:30 עד 19:00')).toEqual({
      title: 'רובוכיף',
      allDay: false,
      startTime: '16:30',
      endTime: '19:00',
    });
  });

  it('keeps an untimed event all-day', () => {
    expect(parseSpecial('ערב לצוותים החינוכיים')).toEqual({
      title: 'ערב לצוותים החינוכיים',
      allDay: true,
    });
  });
});

describe('parseMilestones', () => {
  it('splits on the middle dot after the colon', () => {
    expect(parseMilestones('★ אבני דרך החודש: ועדות היגוי   ·   ימי שיא – אולימפיאדת מתמטיקה')).toEqual([
      'ועדות היגוי',
      'ימי שיא – אולימפיאדת מתמטיקה',
    ]);
  });
});

describe('dates', () => {
  it('adds days across a week', () => {
    expect(addIsoDays('2027-03-20', 7)).toBe('2027-03-27');
  });

  it('builds six weeks for January 2027 and five for October 2026', () => {
    expect(monthWeeks('2027-01')).toHaveLength(6);
    expect(monthWeeks('2026-10')).toHaveLength(5);
    expect(monthWeeks('2026-10')[0]?.[0]?.iso).toBe('2026-09-27');
  });
});

describe('formatHebrew', () => {
  it('uses the Excel spelling for 1 October 2026', () => {
    expect(formatHebrew('2026-10-01')).toBe('20 תשרי');
  });
});

describe('chooseDensity', () => {
  it('stays comfortable when every full chip fits', () => {
    expect(chooseDensity(22, 1)).toEqual({ mode: 'comfortable', visible: 1 });
  });

  it('drops to compact before it overflows', () => {
    expect(chooseDensity(16, 1)).toEqual({ mode: 'compact', visible: 1 });
  });

  it('keeps a full row for the more button', () => {
    const result = chooseDensity(16 + 2 + 16, 4);
    expect(result).toEqual({ mode: 'overflow', visible: 1 });
  });
});

describe('holidayRoles', () => {
  it('joins consecutive equal titles inside a week', () => {
    expect(holidayRoles(['חנוכה', 'חנוכה', null, 'פסח', 'פסח', 'פסח', 'שבועות'])).toEqual([
      'start',
      'end',
      null,
      'start',
      'middle',
      'end',
      'single',
    ]);
  });
});

describe('chip contrast', () => {
  it('keeps course tints at WCAG AA against the chip text', () => {
    for (const hex of Object.values(CELL_COLORS)) {
      expect(contrastRatio(CHIP_TEXT, tint(hex))).toBeGreaterThanOrEqual(4.5);
    }
  });
});
