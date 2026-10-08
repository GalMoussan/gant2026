import { Link } from 'react-router';
import { categoryMap, hebrewFor, monthByKey } from '../../data/model.ts';
import { he } from '../../i18n/he.ts';
import { monthKeyOf, weekdayIndex } from '../../lib/dates.ts';
import { holidayTitleOn } from '../../lib/events.ts';
import { outsideSchoolYear } from '../../lib/form.ts';
import type { CalendarEvent } from '../../types.ts';

interface DayContextProps {
  iso: string;
  events: CalendarEvent[];
  courseCategoryId: string;
}

export function DayContext({ iso, events, courseCategoryId }: DayContextProps) {
  const holiday = holidayTitleOn(events, categoryMap);
  const weekend = weekdayIndex(iso) >= 5;
  const duplicate = courseCategoryId !== '' && events.some((event) => event.categoryId === courseCategoryId);
  const month = monthKeyOf(iso);
  const linked = monthByKey(month);

  return (
    <div>
      <p className="m-0 mb-1 text-sm">
        {he.dayCount(events.length)}
        {linked ? (
          <>
            {' '}
            <Link to={`/?m=${month}&day=${iso}`}>{he.viewList}</Link>
          </>
        ) : null}
        {' · '}
        {hebrewFor(iso)}
      </p>
      {outsideSchoolYear(iso) ? <p className="field-warn">{he.warnRange}</p> : null}
      {holiday ? <p className="field-warn">{he.warnHoliday(holiday)}</p> : null}
      {weekend ? <p className="field-warn">{he.warnWeekend}</p> : null}
      {duplicate ? <p className="field-warn">{he.warnCourse}</p> : null}
    </div>
  );
}
