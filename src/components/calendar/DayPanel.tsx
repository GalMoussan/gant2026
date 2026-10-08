import * as Dialog from '@radix-ui/react-dialog';
import { Link } from 'react-router';
import { GROUP_LABELS } from '../../config/calendar.ts';
import { categoryMap, hebrewFor } from '../../data/model.ts';
import { he } from '../../i18n/he.ts';
import { formatDotDate, weekdayIndex } from '../../lib/dates.ts';
import { chipEvents, holidayTitleOn } from '../../lib/events.ts';
import type { CalendarEvent } from '../../types.ts';
import { ConfirmDelete } from '../ui/ConfirmDelete.tsx';

interface DayPanelProps {
  iso: string | null;
  events: CalendarEvent[];
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function DayPanel({ iso, events, onClose, onDelete }: DayPanelProps) {
  const holiday = iso ? holidayTitleOn(events, categoryMap) : null;
  const chips = chipEvents(events, categoryMap);
  const specials = chips.filter((event) => event.source === 'excel' && categoryMap.get(event.categoryId)?.kind === 'special');
  const user = chips.filter((event) => event.source === 'user');
  const schools = chips.filter((event) => event.source === 'excel' && categoryMap.get(event.categoryId)?.group === 'schools');
  const center = chips.filter((event) => event.source === 'excel' && categoryMap.get(event.categoryId)?.group === 'center');

  return (
    <Dialog.Root open={Boolean(iso)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="day-panel" aria-describedby={undefined}>
          {iso ? (
            <>
              <header className="flex items-start justify-between gap-3 px-4 pt-4">
                <div>
                  <Dialog.Title className="m-0 text-xl font-bold">
                    {he.weekdayLong[weekdayIndex(iso)]} {formatDotDate(iso)}
                  </Dialog.Title>
                  <p className="m-0 text-muted">{hebrewFor(iso)}</p>
                </div>
                <Dialog.Close className="icon-btn" aria-label={he.close}>
                  ×
                </Dialog.Close>
              </header>
              <div className="day-panel-body">
                {holiday ? <p className="holiday-banner is-single">{holiday}</p> : null}
                <EventGroup title={he.specials} events={specials} onDelete={onDelete} />
                <EventGroup title={he.userEvents} events={user} onDelete={onDelete} />
                <EventGroup title={GROUP_LABELS.schools} events={schools} onDelete={onDelete} />
                <EventGroup title={GROUP_LABELS.center} events={center} onDelete={onDelete} />
                {chips.length === 0 && !holiday ? <p>{he.emptyDay}</p> : null}
                <Link className="primary-btn mt-4 inline-flex items-center no-underline" to={`/add?date=${iso}`}>
                  {he.addForDay}
                </Link>
              </div>
            </>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EventGroup({ title, events, onDelete }: { title: string; events: CalendarEvent[]; onDelete: (id: string) => void }) {
  if (events.length === 0) return null;
  return (
    <section className="mt-3">
      <h3 className="m-0 text-sm font-semibold text-muted">{title}</h3>
      <ul className="m-0 list-none p-0">
        {events.map((event) => {
          const category = categoryMap.get(event.categoryId);
          const color = event.color ?? category?.color ?? '#1F4E78';
          const hours =
            category?.groups != null && category.weeklyHoursPerGroup != null
              ? he.groupsHours(category.groups, category.weeklyHoursPerGroup)
              : null;
          return (
            <li key={event.id} className="panel-row" data-event-id={event.id}>
              <span className="dot mt-1" style={{ background: color }} />
              <div className="min-w-0 flex-1">
                <p className="m-0 font-semibold">{event.title}</p>
                {event.startTime && event.endTime ? <p className="m-0 text-sm text-muted">{he.timeRange(event.startTime, event.endTime)}</p> : null}
                {hours ? <p className="m-0 text-sm text-muted">{hours}</p> : null}
                {event.location ? <p className="m-0 text-sm">{event.location}</p> : null}
                {event.notes ? <p className="m-0 text-sm">{event.notes}</p> : null}
                {event.source === 'user' ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Link className="text-btn" to={`/edit/${event.id}`}>
                      {he.edit}
                    </Link>
                    <ConfirmDelete onConfirm={() => onDelete(event.id)} />
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
