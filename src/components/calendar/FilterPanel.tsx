import * as Dialog from '@radix-ui/react-dialog';
import { GROUP_LABELS, SYSTEM_CATEGORIES } from '../../config/calendar.ts';
import { courseCategories } from '../../data/model.ts';
import { he } from '../../i18n/he.ts';
import type { Filters } from '../../lib/events.ts';
import type { CalendarEvent, Category } from '../../types.ts';

interface FilterPanelProps {
  open: boolean;
  filters: Filters;
  events: CalendarEvent[];
  onClose: () => void;
  onChange: (filters: Filters) => void;
}

export function FilterPanel({ open, filters, events, onClose, onChange }: FilterPanelProps) {
  const schools = courseCategories.filter((category) => category.group === 'schools');
  const center = courseCategories.filter((category) => category.group === 'center');
  const extra = SYSTEM_CATEGORIES.filter((category) => category.kind !== 'holiday');
  const clearable = [...courseCategories, ...extra];
  const toggle = (id: string) => {
    const hidden = new Set(filters.hiddenCategoryIds);
    if (hidden.has(id)) hidden.delete(id);
    else hidden.add(id);
    onChange({ ...filters, hiddenCategoryIds: [...hidden] });
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="filter-panel" aria-describedby={undefined}>
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="m-0 text-lg font-bold">{he.filterTitle}</Dialog.Title>
            <Dialog.Close className="icon-btn" aria-label={he.close}>
              ×
            </Dialog.Close>
          </div>
          <label className="field">
            <span className="field-label">{he.search}</span>
            <input
              value={filters.query}
              placeholder={he.searchPlaceholder}
              onChange={(event) => onChange({ ...filters, query: event.target.value })}
            />
          </label>
          <div className="mb-3 flex gap-2">
            <button type="button" className="text-btn" onClick={() => onChange({ ...filters, hiddenCategoryIds: [] })}>
              {he.filterAll}
            </button>
            <button
              type="button"
              className="text-btn"
              onClick={() => onChange({ ...filters, hiddenCategoryIds: clearable.map((category) => category.id) })}
            >
              {he.filterClear}
            </button>
          </div>
          <ToggleRow
            label={he.mineOnly}
            pressed={filters.mineOnly}
            onClick={() => onChange({ ...filters, mineOnly: !filters.mineOnly })}
          />
          <ToggleRow
            label={he.showHolidays}
            pressed={filters.showHolidays}
            onClick={() => onChange({ ...filters, showHolidays: !filters.showHolidays })}
          />
          <CategoryGroup title={GROUP_LABELS.schools} categories={schools} filters={filters} events={events} onToggle={toggle} />
          <CategoryGroup title={GROUP_LABELS.center} categories={center} filters={filters} events={events} onToggle={toggle} />
          <CategoryGroup title={he.otherGroup} categories={extra} filters={filters} events={events} onToggle={toggle} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ToggleRow({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return (
    <div className="switch">
      <span>{label}</span>
      <button type="button" className="text-btn" aria-pressed={pressed} onClick={onClick}>
        {pressed ? '✓' : ''}
      </button>
    </div>
  );
}

function CategoryGroup({
  title,
  categories,
  filters,
  events,
  onToggle,
}: {
  title: string;
  categories: Category[];
  filters: Filters;
  events: CalendarEvent[];
  onToggle: (id: string) => void;
}) {
  return (
    <section className="mt-3">
      <h3 className="m-0 mb-1 text-sm font-semibold">{title}</h3>
      <ul className="m-0 list-none p-0">
        {categories.map((category) => {
          const count = events.filter((event) => event.categoryId === category.id).length;
          const checked = !filters.hiddenCategoryIds.includes(category.id);
          return (
            <li key={category.id}>
              <label className="flex items-center gap-2 py-1 text-sm">
                <input type="checkbox" checked={checked} onChange={() => onToggle(category.id)} />
                <span className="dot" style={{ background: category.color }} />
                <span className="min-w-0 flex-1 truncate">{category.name}</span>
                <span className="text-muted">{count}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
