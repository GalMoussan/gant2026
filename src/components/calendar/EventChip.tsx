import * as Popover from '@radix-ui/react-popover';
import * as Tooltip from '@radix-ui/react-tooltip';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router';
import { CHIP_TEXT, MILESTONE_BG, MILESTONE_TEXT } from '../../config/calendar.ts';
import { categoryMap } from '../../data/model.ts';
import { he } from '../../i18n/he.ts';
import { tint } from '../../lib/color.ts';
import { formatDotDate } from '../../lib/dates.ts';
import type { Density } from '../../lib/density.ts';
import type { CalendarEvent } from '../../types.ts';
import { ConfirmDelete } from '../ui/ConfirmDelete.tsx';

interface EventChipProps {
  event: CalendarEvent;
  density: Density['mode'];
  dimmed: boolean;
  pulse: boolean;
  onDelete: (id: string) => void;
}

export function EventChip({ event, density, dimmed, pulse, onDelete }: EventChipProps) {
  const reduce = useReducedMotion();
  const category = categoryMap.get(event.categoryId);
  const color = event.color ?? category?.color ?? '#1F4E78';
  const milestone = category?.kind === 'milestone';
  const starred = category?.kind === 'special' || milestone;
  const style = milestone
    ? { background: MILESTONE_BG, color: MILESTONE_TEXT, borderInlineStartColor: MILESTONE_TEXT }
    : { background: tint(color), color: CHIP_TEXT, borderInlineStartColor: color };
  const hours =
    category?.groups != null && category.weeklyHoursPerGroup != null
      ? he.groupsHours(category.groups, category.weeklyHoursPerGroup)
      : null;

  return (
    <Popover.Root>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Popover.Trigger asChild>
            <motion.button
              type="button"
              className={`chip is-${density === 'overflow' ? 'compact' : density}${dimmed ? ' is-dim' : ''}`}
              style={style}
              data-event-id={event.id}
              animate={pulse && !reduce ? { boxShadow: ['0 0 0 0 rgba(31,78,120,0.5)', '0 0 0 6px rgba(31,78,120,0)'] } : { boxShadow: '0 0 0 0 rgba(31,78,120,0)' }}
              transition={pulse && !reduce ? { duration: 0.7, repeat: 2, ease: 'easeOut' } : { duration: 0 }}
            >
              {starred ? '★ ' : ''}
              {event.title}
            </motion.button>
          </Popover.Trigger>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="tooltip" side="top">
            <p className="m-0 font-semibold">{event.title}</p>
            {hours ? <p className="m-0">{hours}</p> : null}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
      <Popover.Portal>
        <Popover.Content className="popover" side="bottom" align="start">
          <p className="m-0 font-semibold">
            {starred ? '★ ' : ''}
            {event.title}
          </p>
          <p className="m-0 text-muted">{formatDotDate(event.date)}</p>
          {event.startTime && event.endTime ? <p className="m-0">{he.timeRange(event.startTime, event.endTime)}</p> : null}
          {hours ? <p className="m-0">{hours}</p> : null}
          {event.location ? (
            <p className="m-0">
              {he.locationLabel}: {event.location}
            </p>
          ) : null}
          {event.notes ? <p className="m-0">{event.notes}</p> : null}
          {event.source === 'excel' ? <p className="m-0 text-sm text-muted">{he.fromExcel}</p> : null}
          {event.source === 'user' ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Link className="text-btn" to={`/edit/${event.id}`}>
                {he.edit}
              </Link>
              <ConfirmDelete onConfirm={() => onDelete(event.id)} />
            </div>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
