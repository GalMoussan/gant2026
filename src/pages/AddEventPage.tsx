import * as Select from '@radix-ui/react-select';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { DateField } from '../components/add-event/DateField.tsx';
import { DayContext } from '../components/add-event/DayContext.tsx';
import { LivePreview } from '../components/add-event/LivePreview.tsx';
import { ConfirmDelete } from '../components/ui/ConfirmDelete.tsx';
import { CUSTOM_COLORS, DRAFT_STORAGE_KEY, GROUP_LABELS, SCHOOL_START } from '../config/calendar.ts';
import { categoryMap, courseCategories, excelEvents, monthByKey } from '../data/model.ts';
import { ERROR_TEXT, he } from '../i18n/he.ts';
import { monthKeyOf, todayIso } from '../lib/dates.ts';
import { eventsOnDay } from '../lib/events.ts';
import {
  draftFromEvent,
  emptyDraft,
  firstError,
  outsideSchoolYear,
  parseDraft,
  validateDraft,
  type EventDraft,
  type EventKind,
  type FieldErrors,
  type FieldName,
} from '../lib/form.ts';
import { planSubmission } from '../lib/submitEvent.ts';
import { useCalendar } from '../store/useCalendar.ts';

const QUARTER_HOURS = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4);
  const minute = (index % 4) * 15;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

const KINDS: Array<{ id: EventKind; label: string }> = [
  { id: 'special', label: he.kindSpecial },
  { id: 'milestone', label: he.kindMilestone },
  { id: 'holiday', label: he.kindHoliday },
  { id: 'course', label: he.kindCourse },
  { id: 'custom', label: he.kindCustom },
];

interface AddLocationState {
  skipDraft?: boolean;
  draft?: EventDraft;
}

function initialDate(search: string): string {
  const requested = new URLSearchParams(search).get('date');
  if (requested && /^\d{4}-\d{2}-\d{2}$/.test(requested)) return requested;
  const today = todayIso();
  return outsideSchoolYear(today) ? SCHOOL_START : today;
}

function readStoredDraft(): EventDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? parseDraft(JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function clearStoredDraft(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function AddEventPage() {
  const { id: editId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as AddLocationState | null;
  const userEvents = useCalendar((store) => store.userEvents);
  const ready = useCalendar((store) => store.ready);
  const addUserEvents = useCalendar((store) => store.addUserEvents);
  const updateUserEvent = useCalendar((store) => store.updateUserEvent);
  const removeUserEvents = useCalendar((store) => store.removeUserEvents);
  const showToast = useCalendar((store) => store.showToast);
  const dismissToast = useCalendar((store) => store.dismissToast);
  const saving = useRef(false);
  const skipSave = useRef(Boolean(state?.skipDraft));

  const [draft, setDraft] = useState<EventDraft | null>(() => {
    if (editId) return null;
    if (state?.skipDraft) return state.draft ?? emptyDraft(initialDate(location.search));
    return readStoredDraft() ?? emptyDraft(initialDate(location.search));
  });
  const [loadedEditId, setLoadedEditId] = useState<string | null>(editId ? null : 'new');
  const [restored, setRestored] = useState(() => !editId && !state?.skipDraft && readStoredDraft() !== null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, true>>>({});
  const [submitted, setSubmitted] = useState(false);

  const existing = editId ? userEvents.find((event) => event.id === editId) : undefined;
  const excelHit = editId ? excelEvents.some((event) => event.id === editId) || editId.startsWith('xlsx:') : false;
  if (editId && existing && loadedEditId !== editId) {
    const series = existing.recurrenceGroupId
      ? userEvents.filter((event) => event.recurrenceGroupId === existing.recurrenceGroupId)
      : [existing];
    setLoadedEditId(editId);
    setDraft(draftFromEvent(existing, series));
  }

  useEffect(() => {
    if (!draft || editId || skipSave.current) return;
    try {
      const empty = emptyDraft(initialDate(location.search));
      if (JSON.stringify(draft) === JSON.stringify(empty)) localStorage.removeItem(DRAFT_STORAGE_KEY);
      else localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* storage unavailable */
    }
  }, [draft, editId, location.search]);

  const showWeekly = !existing?.recurrenceGroupId || draft?.seriesScope === 'series';
  const effective = useMemo(() => {
    if (!draft) return null;
    return showWeekly ? draft : { ...draft, weekly: false };
  }, [draft, showWeekly]);

  const dayEvents = useMemo(() => {
    if (!draft) return [];
    return eventsOnDay([...excelEvents, ...userEvents], draft.date, categoryMap);
  }, [draft, userEvents]);

  if (editId && !ready) return <p className="add-page p-6">{he.loading}</p>;
  if (editId && ready && !existing) {
    return (
      <div className="add-page p-6">
        <p>{excelHit ? he.readonlyExcel : he.missingEvent}</p>
        <Link to="/">{he.backToCalendar}</Link>
      </div>
    );
  }
  if (!draft || !effective) return <p className="add-page p-6">{he.loading}</p>;

  const patch = (partial: Partial<EventDraft>) => {
    setDraft((current) => (current ? { ...current, ...partial } : current));
  };
  const visibleError = (field: FieldName) => Boolean((submitted || touched[field]) && errors[field]);
  const mark = (field: FieldName) => {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors(validateDraft(effective));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving.current) return;
    const nextErrors = validateDraft(effective);
    setErrors(nextErrors);
    setSubmitted(true);
    const field = firstError(nextErrors);
    if (field) {
      document.getElementById(`field-${field}`)?.focus();
      return;
    }
    saving.current = true;
    const series = existing?.recurrenceGroupId
      ? userEvents.filter((item) => item.recurrenceGroupId === existing.recurrenceGroupId)
      : [];
    const plan = planSubmission(effective, existing ?? null, series, () => `user:${crypto.randomUUID()}`, new Date().toISOString());
    const known = new Set(userEvents.map((item) => item.id));
    const additions = plan.upserts.filter((item) => !known.has(item.id));
    const updates = plan.upserts.filter((item) => known.has(item.id));
    void (async () => {
      await addUserEvents(additions);
      for (const item of updates) await updateUserEvent(item);
      if (plan.removeIds.length > 0) await removeUserEvents(plan.removeIds);
      skipSave.current = true;
      clearStoredDraft();
      const first = plan.upserts[0];
      const month = first ? monthKeyOf(first.date) : null;
      const inYear = Boolean(month && monthByKey(month));
      if (!existing && first) {
        const show = inYear
          ? [{ label: he.toastShow, run: () => void navigate(`/?m=${month}&focus=${first.id}&pulse=${Date.now()}`) }]
          : [];
        showToast(he.toastAdded, [
          ...show,
          {
            label: he.toastAnother,
            run: () => void navigate(`/add?date=${effective.date}`, { state: { skipDraft: true, draft: { ...effective, title: '' } } }),
          },
          {
            label: he.toastUndo,
            run: () => {
              void removeUserEvents(plan.upserts.map((item) => item.id));
              dismissToast();
            },
          },
        ]);
      } else {
        showToast(he.toastUpdated);
      }
      if (inYear && first) void navigate(`/?m=${month}&focus=${first.id}`);
      else void navigate('/');
      saving.current = false;
    })();
  };

  const onFormKey = (event: KeyboardEvent<HTMLFormElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.requestSubmit();
    }
  };

  const schools = courseCategories.filter((category) => category.group === 'schools');
  const center = courseCategories.filter((category) => category.group === 'center');
  const preview = <LivePreview draft={effective} events={dayEvents} onPick={(iso) => patch({ date: iso, endDate: draft.multiDay ? draft.endDate : iso })} />;

  return (
    <div className="add-page">
      <div className="add-layout">
        <form onSubmit={onSubmit} onKeyDown={onFormKey} noValidate>
          <h1>{existing ? he.formEditTitle : he.formTitle}</h1>
          {restored ? (
            <p className="field-warn draft-note">
              <span>{he.draftRestored}</span>
              <button type="button" className="text-btn" onClick={() => setRestored(false)}>
                {he.dismiss}
              </button>
            </p>
          ) : null}
          <div className="field">
            <label className="field-label" htmlFor="field-title">
              {he.fieldTitle}
            </label>
            <input
              id="field-title"
              value={draft.title}
              autoFocus
              maxLength={80}
              aria-invalid={visibleError('title') || undefined}
              aria-describedby={visibleError('title') ? 'error-title' : undefined}
              onChange={(event) => patch({ title: event.target.value })}
              onBlur={() => mark('title')}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            {visibleError('title') ? (
              <p id="error-title" className="field-error" role="alert">
                {ERROR_TEXT.title}
              </p>
            ) : null}
          </div>
          <DateField
            id="field-date"
            label={he.fieldDate}
            value={draft.date}
            invalid={visibleError('date')}
            describedBy={visibleError('date') ? 'error-date' : undefined}
            onChange={(iso) => patch({ date: iso, endDate: draft.multiDay ? draft.endDate : iso, until: draft.weekly ? draft.until : iso })}
            onBlur={() => mark('date')}
          />
          {visibleError('date') ? (
            <p id="error-date" className="field-error" role="alert">
              {ERROR_TEXT.date}
            </p>
          ) : null}
          <DayContext iso={draft.date} events={dayEvents} courseCategoryId={draft.kind === 'course' ? draft.courseCategoryId : ''} />
          <Switch
            label={he.fieldMulti}
            pressed={draft.multiDay}
            onClick={() => patch({ multiDay: !draft.multiDay, endDate: draft.endDate || draft.date })}
          />
          {draft.multiDay ? (
            <DateField
              id="field-endDate"
              label={he.fieldEnd}
              value={draft.endDate}
              invalid={visibleError('endDate')}
              describedBy={visibleError('endDate') ? 'error-endDate' : undefined}
              onChange={(iso) => patch({ endDate: iso })}
              onBlur={() => mark('endDate')}
            />
          ) : null}
          {visibleError('endDate') ? (
            <p id="error-endDate" className="field-error" role="alert">
              {ERROR_TEXT.endDate}
            </p>
          ) : null}
          <Switch
            label={he.fieldAllDay}
            pressed={draft.kind === 'holiday' || draft.allDay}
            onClick={() => {
              if (draft.kind === 'holiday') return;
              patch({ allDay: !draft.allDay });
            }}
          />
          {draft.kind !== 'holiday' && !draft.allDay ? (
            <div className="time-row">
              <label className="field">
                <span className="field-label">{he.fieldStart}</span>
                <select id="field-time" value={draft.startTime} aria-invalid={visibleError('time') || undefined} onChange={(event) => patch({ startTime: event.target.value })} onBlur={() => mark('time')}>
                  {QUARTER_HOURS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">{he.fieldEndTime}</span>
                <select value={draft.endTime} onChange={(event) => patch({ endTime: event.target.value })} onBlur={() => mark('time')}>
                  {QUARTER_HOURS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          {visibleError('time') ? (
            <p id="error-time" className="field-error" role="alert">
              {ERROR_TEXT.time}
            </p>
          ) : null}
          <div className="field">
            <span className="field-label" id="kind-label">
              {he.fieldKind}
            </span>
            <ToggleGroup.Root
              className="kind-group"
              type="single"
              value={draft.kind}
              aria-labelledby="kind-label"
              onValueChange={(value) => {
                if (!value) return;
                const kind = value as EventKind;
                patch({ kind, allDay: kind === 'holiday' ? true : draft.allDay });
              }}
            >
              {KINDS.map((kind) => (
                <ToggleGroup.Item key={kind.id} value={kind.id}>
                  {kind.label}
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </div>
          {draft.kind === 'course' ? (
            <div className="field">
              <span className="field-label" id="course-label">
                {he.fieldCourse}
              </span>
              <Select.Root value={draft.courseCategoryId || undefined} onValueChange={(courseCategoryId) => patch({ courseCategoryId })}>
                <Select.Trigger id="field-category" className="date-trigger" aria-labelledby="course-label" aria-invalid={visibleError('category') || undefined}>
                  <Select.Value placeholder={he.fieldCourse} />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="popover" position="popper">
                    <Select.Viewport>
                      <CourseGroup label={GROUP_LABELS.schools} categories={schools} />
                      <CourseGroup label={GROUP_LABELS.center} categories={center} />
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
              {visibleError('category') ? (
                <p className="field-error" role="alert">
                  {ERROR_TEXT.category}
                </p>
              ) : null}
            </div>
          ) : null}
          {draft.kind === 'custom' ? (
            <div className="field">
              <span className="field-label">{he.fieldColor}</span>
              <div id="field-category" className="swatches" role="radiogroup" aria-label={he.fieldColor}>
                {CUSTOM_COLORS.map((color, index) => (
                  <button
                    key={color}
                    type="button"
                    role="radio"
                    className="swatch"
                    style={{ background: color }}
                    aria-label={he.colorLabel(index + 1)}
                    aria-checked={draft.color === color}
                    onClick={() => patch({ color })}
                  />
                ))}
              </div>
            </div>
          ) : null}
          <label className="field">
            <span className="field-label">{he.fieldLocation}</span>
            <input value={draft.location} onChange={(event) => patch({ location: event.target.value })} />
          </label>
          <label className="field">
            <span className="field-label">{he.fieldNotes}</span>
            <textarea
              id="field-notes"
              value={draft.notes}
              maxLength={500}
              aria-invalid={visibleError('notes') || undefined}
              onChange={(event) => patch({ notes: event.target.value })}
              onBlur={() => mark('notes')}
            />
            <span className="text-sm text-muted">{he.notesCount(draft.notes.length)}</span>
            {visibleError('notes') ? (
              <p className="field-error" role="alert">
                {ERROR_TEXT.notes}
              </p>
            ) : null}
          </label>
          {existing?.recurrenceGroupId ? (
            <div className="kind-group mb-3" role="radiogroup" aria-label={`${he.seriesOne} / ${he.seriesAll}`}>
              <label className="choice">
                <input type="radio" name="series" checked={draft.seriesScope === 'one'} onChange={() => patch({ seriesScope: 'one' })} />
                {he.seriesOne}
              </label>
              <label className="choice">
                <input type="radio" name="series" checked={draft.seriesScope === 'series'} onChange={() => patch({ seriesScope: 'series' })} />
                {he.seriesAll}
              </label>
            </div>
          ) : null}
          {showWeekly ? (
            <>
              <Switch label={he.fieldWeekly} pressed={draft.weekly} onClick={() => patch({ weekly: !draft.weekly, until: draft.until || draft.date })} />
              {draft.weekly ? (
                <DateField
                  id="field-until"
                  label={he.fieldUntil}
                  value={draft.until}
                  invalid={visibleError('until')}
                  describedBy={visibleError('until') ? 'error-until' : undefined}
                  onChange={(iso) => patch({ until: iso })}
                  onBlur={() => mark('until')}
                />
              ) : null}
              {visibleError('until') ? (
                <p id="error-until" className="field-error" role="alert">
                  {ERROR_TEXT.until}
                </p>
              ) : null}
            </>
          ) : null}
          <div className="preview-mobile mb-4">{preview}</div>
          <button type="submit" className="primary-btn">
            {existing ? he.saveEdit : he.submit}
          </button>
          {existing ? (
            <div className="mt-4">
              <ConfirmDelete
                label={he.deleteEvent}
                onConfirm={() => {
                  void removeUserEvents([existing.id]).then(() => {
                    showToast(he.toastDeleted);
                    void navigate('/');
                  });
                }}
              />
            </div>
          ) : null}
        </form>
        <div className="preview-desktop">{preview}</div>
      </div>
    </div>
  );
}

function Switch({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return (
    <div className="switch">
      <span>{label}</span>
      <button type="button" className="text-btn" aria-pressed={pressed} onClick={onClick}>
        {pressed ? '✓' : ''}
      </button>
    </div>
  );
}

function CourseGroup({ label, categories }: { label: string; categories: Array<{ id: string; name: string }> }) {
  return (
    <Select.Group>
      <Select.Label className="px-2 py-1 text-xs text-muted">{label}</Select.Label>
      {categories.map((category) => (
        <Select.Item key={category.id} value={category.id} className="cursor-pointer px-2 py-1 outline-none data-[highlighted]:bg-paper">
          <Select.ItemText>{category.name}</Select.ItemText>
        </Select.Item>
      ))}
    </Select.Group>
  );
}
