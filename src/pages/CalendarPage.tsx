import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { DayPanel } from '../components/calendar/DayPanel.tsx';
import { FilterPanel } from '../components/calendar/FilterPanel.tsx';
import { MonthSection } from '../components/calendar/MonthSection.tsx';
import { YearRail } from '../components/calendar/YearRail.tsx';
import { adjacentMonth, categoryMap, courseCategories, excelEvents, hebrewFor, initialMonth, monthByKey, seed } from '../data/model.ts';
import { he } from '../i18n/he.ts';
import { monthKeyOf, monthWeeks, todayIso, weekdayIndex } from '../lib/dates.ts';
import { eventsOnDay } from '../lib/events.ts';
import { outsideSchoolYear } from '../lib/form.ts';
import { scrollToMonth } from '../lib/scroll.ts';
import { useMediaQuery } from '../lib/useMedia.ts';
import { useCalendar } from '../store/useCalendar.ts';
import type { CalendarEvent } from '../types.ts';

export function CalendarPage() {
  const userEvents = useCalendar((state) => state.userEvents);
  const filters = useCalendar((state) => state.filters);
  const setFilters = useCalendar((state) => state.setFilters);
  const removeUserEvents = useCalendar((state) => state.removeUserEvents);
  const showToast = useCalendar((state) => state.showToast);
  const navigate = useNavigate();
  const location = useLocation();
  const mobile = useMediaQuery('(max-width: 767px)');
  const today = todayIso();
  const [visible, setVisible] = useState(() => initialMonth(window.location.search, today));
  const visibleRef = useRef(visible);
  const [focusedIso, setFocusedIso] = useState(outsideSchoolYear(today) ? '2026-10-01' : today);
  const [dayIso, setDayIso] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [pulseDay, setPulseDay] = useState<string | null>(null);
  const booted = useRef(false);
  const hiddenFocus = useRef(false);

  const allEvents = useMemo(() => [...excelEvents, ...userEvents], [userEvents]);
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const month of seed.months) {
      for (const week of monthWeeks(month.key)) {
        for (const day of week) map.set(day.iso, eventsOnDay(allEvents, day.iso, categoryMap, filters));
      }
    }
    return map;
  }, [allEvents, filters]);

  const extraMilestones = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const event of userEvents) {
      if (categoryMap.get(event.categoryId)?.kind !== 'milestone') continue;
      const end = (event.endDate ?? event.date).slice(0, 7);
      const start = event.date.slice(0, 7);
      for (const month of seed.months) {
        if (month.key < start || month.key > end) continue;
        const list = map.get(month.key) ?? [];
        if (!list.includes(event.title)) list.push(event.title);
        map.set(month.key, list);
      }
    }
    return map;
  }, [userEvents]);

  useLayoutEffect(() => {
    const first = !booted.current;
    booted.current = true;
    const params = new URLSearchParams(location.search);
    const requested = params.get('m');
    const key = requested && monthByKey(requested) ? requested : visibleRef.current;
    if (first || key !== visibleRef.current) {
      visibleRef.current = key;
      setVisible(key);
      scrollToMonth(key, first ? 'auto' : 'smooth');
      const month = monthByKey(key);
      document.title = `${month?.title ?? key} · ${he.appTitle}`;
    }
    const focus = params.get('focus');
    const day = params.get('day');
    if (focus) {
      hiddenFocus.current = false;
      setPulseId(focus);
    }
    if (day) setDayIso(day);
  }, [location.search]);

  useEffect(() => {
    if (!pulseId) return;
    const timer = window.setTimeout(() => setPulseId(null), 2200);
    return () => window.clearTimeout(timer);
  }, [pulseId]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.scrollport');
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const key = (best?.target as HTMLElement | undefined)?.dataset.month;
        if (!key || key === visibleRef.current) return;
        visibleRef.current = key;
        setVisible(key);
        const url = new URL(window.location.href);
        url.searchParams.set('m', key);
        url.searchParams.delete('focus');
        const query = url.searchParams.toString();
        history.replaceState(null, '', query ? `${url.pathname}?${query}` : url.pathname);
        const month = monthByKey(key);
        document.title = `${month?.title ?? key} · ${he.appTitle}`;
      },
      { root, threshold: [0.6, 0.8] },
    );
    root.querySelectorAll('.month').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.scrollport');
    if (!root) return;
    let locked = false;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || document.querySelector('[role="dialog"]')) return;
      if (Math.abs(event.deltaY) < 12) return;
      event.preventDefault();
      if (locked) return;
      locked = true;
      const next = adjacentMonth(visibleRef.current, event.deltaY > 0 ? 1 : -1);
      if (next) scrollToMonth(next);
      window.setTimeout(() => {
        locked = false;
      }, 480);
    };
    root.addEventListener('wheel', onWheel, { passive: false });
    return () => root.removeEventListener('wheel', onWheel);
  }, []);

  const jump = useCallback((key: string | null) => {
    if (!key) return;
    scrollToMonth(key);
    setFocusedIso(firstInMonth(key));
  }, []);

  const goToday = useCallback(() => {
    const key = seed.months.some((month) => month.key === monthKeyOf(today)) ? monthKeyOf(today) : (seed.months[0]?.key ?? '2026-10');
    scrollToMonth(key);
    if (!outsideSchoolYear(today)) {
      setFocusedIso(today);
      setPulseDay(today);
      window.setTimeout(() => setPulseDay(null), 2000);
    }
  }, [today]);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (document.querySelector('[role="dialog"], [role="listbox"]')) return;
      const inGrid = Boolean(target?.closest('[data-date]'));
      if (event.key === 'PageDown' || event.key === 'j' || event.key === 'J' || (event.key === 'ArrowDown' && !inGrid)) {
        event.preventDefault();
        jump(adjacentMonth(visibleRef.current, 1));
      } else if (event.key === 'PageUp' || event.key === 'k' || event.key === 'K' || (event.key === 'ArrowUp' && !inGrid)) {
        event.preventDefault();
        jump(adjacentMonth(visibleRef.current, -1));
      } else if (event.key === 't' || event.key === 'T') {
        goToday();
      } else if (event.key === 'n' || event.key === 'N') {
        void navigate('/add');
      } else if (event.key === 'f' || event.key === 'F') {
        setFilterOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goToday, jump, navigate]);

  const onKeyDown = useCallback((event: KeyboardEvent, iso: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setDayIso(iso);
      return;
    }
    const next = moveWithinMonth(iso, event.key);
    if (!next || !event.key.startsWith('Arrow')) return;
    event.preventDefault();
    setFocusedIso(next);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-date="${next}"]`)?.focus());
  }, []);

  const onHiddenFocus = useCallback((iso: string) => {
    if (hiddenFocus.current) return;
    hiddenFocus.current = true;
    setDayIso(iso);
  }, []);

  const onDelete = useCallback(
    (id: string) => {
      void removeUserEvents([id]).then(() => showToast(he.toastDeleted));
    },
    [removeUserEvents, showToast],
  );

  const hiddenCount = filters.hiddenCategoryIds.filter((id) => courseCategories.some((category) => category.id === id)).length;
  const filterLabel = hiddenCount > 0 ? he.showing(courseCategories.length - hiddenCount, courseCategories.length) : null;

  return (
    <>
      <div className="scrollport">
        {seed.months.map((month) => (
          <MonthSection
            key={month.key}
            month={month}
            extraMilestones={extraMilestones.get(month.key) ?? []}
            eventsByDay={eventsByDay}
            today={today}
            pulseDay={pulseDay}
            pulseId={pulseId}
            query={filters.query}
            filterLabel={filterLabel}
            focusedIso={focusedIso}
            mobile={mobile}
            onFocusDay={setFocusedIso}
            onOpenDay={setDayIso}
            onAdd={(iso) => void navigate(`/add?date=${iso}`)}
            onDelete={onDelete}
            onKeyDown={onKeyDown}
            onPrev={() => jump(adjacentMonth(month.key, -1))}
            onNext={() => jump(adjacentMonth(month.key, 1))}
            onToday={goToday}
            onPickMonth={(key) => jump(key)}
            onFilter={() => setFilterOpen(true)}
            onHiddenFocus={onHiddenFocus}
          />
        ))}
      </div>
      <YearRail current={visible} onJump={(key) => jump(key)} />
      {mobile ? (
        <Link className="fab" to="/add" aria-label={he.addEvent}>
          +
        </Link>
      ) : null}
      <DayPanel iso={dayIso} events={dayIso ? (eventsByDay.get(dayIso) ?? []) : []} onClose={() => setDayIso(null)} onDelete={onDelete} />
      <FilterPanel open={filterOpen} filters={filters} events={allEvents} onClose={() => setFilterOpen(false)} onChange={setFilters} />
      <span className="sr-only">{hebrewFor(focusedIso)} {he.weekdayLong[weekdayIndex(focusedIso)]}</span>
    </>
  );
}

function firstInMonth(key: string): string {
  for (const week of monthWeeks(key)) {
    const day = week.find((item) => item.inMonth);
    if (day) return day.iso;
  }
  return `${key}-01`;
}

function moveWithinMonth(iso: string, key: string): string | null {
  const weeks = monthWeeks(monthKeyOf(iso));
  let row = -1;
  let col = -1;
  weeks.forEach((week, rowIndex) => {
    week.forEach((day, colIndex) => {
      if (day.iso === iso) {
        row = rowIndex;
        col = colIndex;
      }
    });
  });
  if (row < 0) return null;
  if (key === 'ArrowRight') col -= 1;
  else if (key === 'ArrowLeft') col += 1;
  else if (key === 'ArrowDown') row += 1;
  else if (key === 'ArrowUp') row -= 1;
  else return null;
  const target = weeks[row]?.[col];
  if (!target?.inMonth) return iso;
  return target.iso;
}
