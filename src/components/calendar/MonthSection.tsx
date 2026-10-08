import { useCallback, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { categoryMap, hebrewFor } from '../../data/model.ts';
import { he } from '../../i18n/he.ts';
import { chooseDensity, type Density } from '../../lib/density.ts';
import { monthWeeks } from '../../lib/dates.ts';
import { chipEvents, holidayRoles, holidayTitleOn } from '../../lib/events.ts';
import type { CalendarEvent, MonthMeta } from '../../types.ts';
import { DayCell } from './DayCell.tsx';
import { MonthHeader } from './MonthHeader.tsx';

interface MonthSectionProps {
  month: MonthMeta;
  extraMilestones: string[];
  eventsByDay: Map<string, CalendarEvent[]>;
  today: string;
  pulseDay: string | null;
  pulseId: string | null;
  query: string;
  filterLabel: string | null;
  focusedIso: string | null;
  mobile: boolean;
  onFocusDay: (iso: string) => void;
  onOpenDay: (iso: string) => void;
  onAdd: (iso: string) => void;
  onDelete: (id: string) => void;
  onKeyDown: (event: KeyboardEvent, iso: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onPickMonth: (key: string) => void;
  onFilter: () => void;
  onHiddenFocus: (iso: string) => void;
}

export function MonthSection({
  month,
  extraMilestones,
  eventsByDay,
  today,
  pulseDay,
  pulseId,
  query,
  filterLabel,
  focusedIso,
  mobile,
  onFocusDay,
  onOpenDay,
  onAdd,
  onDelete,
  onKeyDown,
  onPrev,
  onNext,
  onToday,
  onPickMonth,
  onFilter,
  onHiddenFocus,
}: MonthSectionProps) {
  const weeks = useMemo(() => monthWeeks(month.key), [month.key]);
  const stacks = useRef(new Map<string, HTMLDivElement>());
  const [densities, setDensities] = useState<Record<string, Density>>({});
  const registerStack = useCallback((iso: string, element: HTMLDivElement | null) => {
    if (element) stacks.current.set(iso, element);
    else stacks.current.delete(iso);
  }, []);

  const signature = weeks
    .flat()
    .map((day) => `${day.iso}:${eventsByDay.get(day.iso)?.length ?? 0}`)
    .join('|');

  useLayoutEffect(() => {
    if (mobile) return;
    let frame = 0;
    const measure = () => {
      const next: Record<string, Density> = {};
      stacks.current.forEach((element, iso) => {
        next[iso] = chooseDensity(element.clientHeight, Number(element.dataset.count ?? 0));
      });
      setDensities((previous) => (sameDensity(previous, next) ? previous : next));
    };
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    stacks.current.forEach((element) => observer.observe(element));
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [mobile, signature]);

  useLayoutEffect(() => {
    if (!pulseId) return;
    for (const week of weeks) {
      for (const day of week) {
        const events = chipEvents(eventsByDay.get(day.iso) ?? [], categoryMap);
        const index = events.findIndex((event) => event.id === pulseId);
        if (index < 0) continue;
        if (mobile) {
          onHiddenFocus(day.iso);
          continue;
        }
        const density = densities[day.iso];
        if (density && density.mode === 'overflow' && index >= density.visible) onHiddenFocus(day.iso);
      }
    }
  }, [pulseId, densities, eventsByDay, mobile, onHiddenFocus, weeks]);

  const milestones = [...month.milestones, ...extraMilestones];

  return (
    <section className="month" id={`month-${month.key}`} data-month={month.key} aria-label={month.title} style={{ ['--weeks' as string]: weeks.length }}>
      <MonthHeader
        title={month.title}
        hebrewRange={month.hebrewRange}
        monthKey={month.key}
        milestones={milestones}
        filterLabel={filterLabel}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
        onPickMonth={onPickMonth}
        onFilter={onFilter}
      />
      <div className="month-grid" role="grid" aria-label={month.title}>
        <div className="weekday-row" role="row">
          {he.weekday.map((name) => (
            <span key={name} role="columnheader">
              {name}
            </span>
          ))}
        </div>
        {weeks.map((week) => {
          const titles = week.map((day) => (day.inMonth ? holidayTitleOn(eventsByDay.get(day.iso) ?? [], categoryMap) : null));
          const roles = holidayRoles(titles);
          return (
            <div className="week" role="row" key={week[0]?.iso ?? month.key}>
              {week.map((day, index) => {
                const all = eventsByDay.get(day.iso) ?? [];
                const chips = chipEvents(all, categoryMap);
                return (
                  <DayCell
                    key={day.iso}
                    iso={day.iso}
                    inMonth={day.inMonth}
                    hebrew={day.inMonth ? hebrewFor(day.iso) : ''}
                    isToday={day.iso === today}
                    pulseDay={pulseDay === day.iso}
                    holiday={titles[index] ?? null}
                    holidayRole={roles[index] ?? null}
                    chips={chips}
                    density={densities[day.iso] ?? { mode: 'compact', visible: chips.length }}
                    query={query}
                    pulseId={pulseId}
                    tabIndex={day.inMonth && day.iso === focusedIso ? 0 : -1}
                    mobile={mobile}
                    onFocusDay={onFocusDay}
                    onOpenDay={onOpenDay}
                    onAdd={onAdd}
                    onKeyDown={onKeyDown}
                    onDelete={onDelete}
                    registerStack={registerStack}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function sameDensity(previous: Record<string, Density>, next: Record<string, Density>): boolean {
  const keys = Object.keys(next);
  if (keys.length !== Object.keys(previous).length) return false;
  return keys.every((key) => previous[key]?.mode === next[key]?.mode && previous[key]?.visible === next[key]?.visible);
}
