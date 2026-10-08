import { memo, type KeyboardEvent } from 'react';
import { categoryMap } from '../../data/model.ts';
import { he } from '../../i18n/he.ts';
import { formatDotDate, weekdayIndex } from '../../lib/dates.ts';
import type { Density } from '../../lib/density.ts';
import { matchesQuery } from '../../lib/events.ts';
import type { SpanRole } from '../../lib/events.ts';
import type { CalendarEvent } from '../../types.ts';
import { EventChip } from './EventChip.tsx';

interface DayCellProps {
  iso: string;
  inMonth: boolean;
  hebrew: string;
  isToday: boolean;
  pulseDay: boolean;
  holiday: string | null;
  holidayRole: SpanRole | null;
  chips: CalendarEvent[];
  density: Density;
  query: string;
  pulseId: string | null;
  tabIndex: number;
  mobile: boolean;
  onFocusDay: (iso: string) => void;
  onOpenDay: (iso: string) => void;
  onAdd: (iso: string) => void;
  onKeyDown: (event: KeyboardEvent, iso: string) => void;
  onDelete: (id: string) => void;
  registerStack: (iso: string, element: HTMLDivElement | null) => void;
}

function DayCellComponent({
  iso,
  inMonth,
  hebrew,
  isToday,
  pulseDay,
  holiday,
  holidayRole,
  chips,
  density,
  query,
  pulseId,
  tabIndex,
  mobile,
  onFocusDay,
  onOpenDay,
  onAdd,
  onKeyDown,
  onDelete,
  registerStack,
}: DayCellProps) {
  const dayNum = Number(iso.slice(8, 10));
  const weekend = weekdayIndex(iso) >= 5;
  const label = `${he.weekdayLong[weekdayIndex(iso)] ?? ''} ${formatDotDate(iso)}${hebrew ? `, ${hebrew}` : ''}, ${he.dayItems(chips.length + (holiday ? 1 : 0))}`;
  const visible = mobile ? chips : chips.slice(0, density.mode === 'overflow' ? density.visible : chips.length);
  const hidden = mobile ? 0 : chips.length - visible.length;
  const mode = density.mode === 'comfortable' ? 'comfortable' : 'compact';

  if (!inMonth) {
    return (
      <div className={`day is-out${weekend ? ' is-weekend' : ''}`} role="gridcell" aria-disabled="true">
        <div className="day-head">
          <span className="day-num">{dayNum}</span>
        </div>
      </div>
    );
  }

  const dots = uniqueDots(chips);

  return (
    <div
      className={`day${weekend ? ' is-weekend' : ''}${holiday ? ' is-holiday' : ''}${isToday ? ' is-today' : ''}`}
      role="gridcell"
      tabIndex={tabIndex}
      data-date={iso}
      aria-label={label}
      aria-current={isToday ? 'date' : undefined}
      onFocus={() => onFocusDay(iso)}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('button, a')) return;
        onOpenDay(iso);
      }}
      onKeyDown={(event) => onKeyDown(event, iso)}
    >
      {holiday && holidayRole ? (
        <div className={`holiday-banner is-${holidayRole}`}>{holidayRole === 'middle' ? '' : holiday}</div>
      ) : null}
      <div className="day-head">
        <span className={`day-num${isToday ? ' is-today' : ''}${pulseDay ? ' is-pulse' : ''}`}>{dayNum}</span>
        <span className="day-heb">{hebrew}</span>
        <button type="button" className="day-add" tabIndex={-1} aria-label={he.addOnDay} onClick={() => onAdd(iso)}>
          +
        </button>
      </div>
      {mobile ? (
        <div className="dots">
          {dots.slice(0, 4).map((dot) => (
            <span key={dot.id} className="dot" style={{ background: dot.color }} />
          ))}
          {dots.length > 4 ? <span className="dot-more">+</span> : null}
        </div>
      ) : (
        <div className="day-events" data-count={chips.length} ref={(element) => registerStack(iso, element)}>
          {visible.map((event) => (
            <EventChip
              key={event.id}
              event={event}
              density={mode}
              dimmed={!matchesQuery(event, query)}
              pulse={pulseId === event.id}
              onDelete={onDelete}
            />
          ))}
          {hidden > 0 ? (
            <button type="button" className="more-btn is-compact" onClick={() => onOpenDay(iso)}>
              {he.more(hidden)}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function uniqueDots(events: CalendarEvent[]): Array<{ id: string; color: string }> {
  const seen = new Set<string>();
  const dots: Array<{ id: string; color: string }> = [];
  for (const event of events) {
    if (seen.has(event.categoryId)) continue;
    seen.add(event.categoryId);
    const category = categoryMap.get(event.categoryId);
    dots.push({ id: event.categoryId, color: event.color ?? category?.color ?? '#1F4E78' });
  }
  return dots;
}

export const DayCell = memo(DayCellComponent);
