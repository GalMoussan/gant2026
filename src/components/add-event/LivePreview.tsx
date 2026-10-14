import { CHIP_TEXT, MILESTONE_BG, MILESTONE_TEXT } from '../../config/calendar.ts';
import { categoryMap, hebrewFor } from '../../data/model.ts';
import { he } from '../../i18n/he.ts';
import { tint } from '../../lib/color.ts';
import { formatDotDate, monthKeyOf, monthWeeks } from '../../lib/dates.ts';
import { categoryIdFor, type EventDraft } from '../../lib/form.ts';
import type { CalendarEvent } from '../../types.ts';

interface LivePreviewProps {
  draft: EventDraft;
  events: CalendarEvent[];
  onPick: (iso: string) => void;
}

export function LivePreview({ draft, events, onPick }: LivePreviewProps) {
  const weeks = monthWeeks(monthKeyOf(draft.date));
  const rangeEnd = draft.multiDay ? draft.endDate : draft.date;
  const [yearText, monthText] = monthKeyOf(draft.date).split('-');

  return (
    <aside className="preview-card">
      <h2 className="m-0 mb-3 text-base font-bold">{he.preview}</h2>
      <PreviewChip draft={draft} />
      <p className="mb-3 mt-2 text-sm text-muted">
        {formatDotDate(draft.date)} · {hebrewFor(draft.date)}
      </p>
      <p className="m-0 mb-2 text-sm font-semibold">
        {he.gregorianMonth[Number(monthText) - 1]} {yearText}
      </p>
      <div className="mini-grid mb-1">
        {he.weekday.map((name) => (
          <span key={name} className="text-center text-xs text-muted">
            {name}
          </span>
        ))}
      </div>
      <div className="mini-grid">
        {weeks.flat().map((day) => {
          const inRange = day.iso >= draft.date && day.iso <= rangeEnd && rangeEnd >= draft.date;
          const on = day.iso === draft.date;
          return (
            <button
              key={day.iso}
              type="button"
              className={`mini-day${on ? ' is-on' : inRange ? ' is-range' : ''}${day.inMonth ? '' : ' is-out'}`}
              onClick={() => onPick(day.iso)}
            >
              {Number(day.iso.slice(8, 10))}
            </button>
          );
        })}
      </div>
      <h3 className="mb-1 mt-4 text-sm font-semibold">{he.existingOnDay}</h3>
      {events.length === 0 ? (
        <p className="m-0 text-sm text-muted">{he.noExisting}</p>
      ) : (
        <ul className="m-0 list-none p-0 text-sm">
          {events.map((event) => (
            <li key={event.id} className="py-1">
              {event.title}
              {event.startTime && event.endTime ? <span className="text-muted"> {he.timeRange(event.startTime, event.endTime)}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function PreviewChip({ draft }: { draft: EventDraft }) {
  const category = categoryMap.get(categoryIdFor(draft));
  const color = draft.kind === 'custom' ? draft.color : (category?.color ?? '#1F4E78');
  const title = draft.title.trim() || he.previewEmpty;
  if (draft.kind === 'holiday') return <p className="holiday-banner is-single">{title}</p>;
  const milestone = draft.kind === 'milestone';
  const style = milestone
    ? { background: MILESTONE_BG, color: MILESTONE_TEXT, borderInlineStartColor: MILESTONE_TEXT }
    : { background: tint(color), color: CHIP_TEXT, borderInlineStartColor: color };
  return (
    <span className="chip is-comfortable preview-chip" style={style}>
      {draft.kind === 'special' || milestone ? '★ ' : ''}
      {title}
      {!draft.allDay ? ` ${he.timeRange(draft.startTime, draft.endTime)}` : ''}
    </span>
  );
}
