import * as Popover from '@radix-ui/react-popover';
import { useState } from 'react';
import { hebrewFor } from '../../data/model.ts';
import { he } from '../../i18n/he.ts';
import { formatDotDate, monthKeyOf, monthWeeks } from '../../lib/dates.ts';

interface DateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (iso: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  describedBy?: string;
}

function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year ?? 2026, (month ?? 1) - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function DateField({ id, label, value, onChange, onBlur, invalid, describedBy }: DateFieldProps) {
  const [view, setView] = useState(() => monthKeyOf(value));
  const [tracked, setTracked] = useState(value);
  if (value !== tracked) {
    setTracked(value);
    setView(monthKeyOf(value));
  }
  const [yearText, monthText] = view.split('-');
  const monthIndex = Number(monthText) - 1;
  const heading = `${he.gregorianMonth[monthIndex] ?? ''} ${yearText ?? ''}`;
  const weeks = monthWeeks(view);

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <Popover.Root onOpenChange={(open) => { if (!open) onBlur?.(); }}>
        <Popover.Trigger asChild>
          <button
            id={id}
            type="button"
            className="date-trigger"
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
          >
            {formatDotDate(value)} · {hebrewFor(value)}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="popover date-popover" align="start" sideOffset={6}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <button type="button" className="icon-btn" aria-label={he.prevMonth} onClick={() => setView((current) => shiftMonth(current, -1))}>
                ›
              </button>
              <strong>{heading}</strong>
              <button type="button" className="icon-btn" aria-label={he.nextMonth} onClick={() => setView((current) => shiftMonth(current, 1))}>
                ‹
              </button>
            </div>
            <div className="mini-grid mb-1">
              {he.weekday.map((name) => (
                <span key={name} className="text-center text-xs text-muted">
                  {name}
                </span>
              ))}
            </div>
            <div className="mini-grid">
              {weeks.flat().map((day) => {
                const on = day.iso === value;
                return (
                  <button
                    key={day.iso}
                    type="button"
                    className={`mini-day${on ? ' is-on' : ''}${day.inMonth ? '' : ' is-out'}`}
                    onClick={() => onChange(day.iso)}
                  >
                    {Number(day.iso.slice(8, 10))}
                  </button>
                );
              })}
            </div>
            <p className="m-0 mt-2 text-sm text-muted">{hebrewFor(value)}</p>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
