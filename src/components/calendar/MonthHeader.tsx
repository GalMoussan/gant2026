import * as Popover from '@radix-ui/react-popover';
import * as Select from '@radix-ui/react-select';
import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { seed } from '../../data/model.ts';
import { he } from '../../i18n/he.ts';

interface MonthHeaderProps {
  title: string;
  hebrewRange: string;
  monthKey: string;
  milestones: string[];
  filterLabel: string | null;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onPickMonth: (key: string) => void;
  onFilter: () => void;
}

export function MonthHeader({
  title,
  hebrewRange,
  monthKey,
  milestones,
  filterLabel,
  onPrev,
  onNext,
  onToday,
  onPickMonth,
  onFilter,
}: MonthHeaderProps) {
  return (
    <header className="month-header">
      <div className="month-title-block">
        <h2 className="month-title">{title}</h2>
        <p className="hebrew-range">{hebrewRange}</p>
        <Milestones items={milestones} />
        {filterLabel ? <p className="filter-status">{filterLabel}</p> : null}
      </div>
      <div className="month-actions">
        <button type="button" className="icon-btn" aria-label={he.prevMonth} onClick={onPrev}>
          ›
        </button>
        <button type="button" className="icon-btn" aria-label={he.nextMonth} onClick={onNext}>
          ‹
        </button>
        <button type="button" className="text-btn" onClick={onToday}>
          {he.today}
        </button>
        <Select.Root value={monthKey} onValueChange={onPickMonth}>
          <Select.Trigger className="text-btn" aria-label={he.pickMonth}>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="popover" position="popper">
              <Select.Viewport>
                {seed.months.map((month) => (
                  <Select.Item key={month.key} value={month.key} className="cursor-pointer px-2 py-1 outline-none data-[highlighted]:bg-paper">
                    <Select.ItemText>{month.title}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
        <button type="button" className="text-btn" onClick={onFilter}>
          {he.filter}
        </button>
        <Link className="primary-btn" to="/add">
          + {he.addEvent}
        </Link>
      </div>
    </header>
  );
}

function Milestones({ items }: { items: string[] }) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  useLayoutEffect(() => {
    const element = measureRef.current;
    if (!element) return;
    const check = () => setOverflow(element.scrollWidth > element.clientWidth + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(element);
    return () => observer.disconnect();
  }, [items]);
  if (items.length === 0) return null;
  return (
    <div className="pill-slot">
      <div className="pill-measure" ref={measureRef} aria-hidden="true">
        {items.map((item) => (
          <span key={item} className="pill">
            ★ {item}
          </span>
        ))}
      </div>
      {overflow ? (
        <Popover.Root>
          <Popover.Trigger className="pill" type="button">
            {he.milestonesCount(items.length)}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content className="popover">
              <ul className="m-0 list-none p-0">
                {items.map((item) => (
                  <li key={item}>★ {item}</li>
                ))}
              </ul>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      ) : (
        <div className="pills">
          {items.map((item) => (
            <span key={item} className="pill">
              ★ {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
