import * as Popover from '@radix-ui/react-popover';
import { useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { he } from '../../i18n/he.ts';
import { parseBackup } from '../../lib/events.ts';
import { useSession } from '../../store/session.ts';
import { useCalendar } from '../../store/useCalendar.ts';

export function AppBar() {
  const location = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const userEvents = useCalendar((state) => state.userEvents);
  const importUserEvents = useCalendar((state) => state.importUserEvents);
  const showToast = useCalendar((state) => state.showToast);
  const session = useSession();
  const onAdd = location.pathname.startsWith('/add') || location.pathname.startsWith('/edit');

  const onExport = () => {
    const payload = { version: 1, exportedAt: new Date().toISOString(), events: userEvents };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'luach-tashpaz-backup.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const onImport = async (file: File) => {
    let events: ReturnType<typeof parseBackup>;
    try {
      events = parseBackup(await file.text());
    } catch {
      showToast(he.importBad);
      return;
    }
    if (!events) {
      showToast(he.importBad);
      return;
    }
    try {
      const count = await importUserEvents(events);
      showToast(count > 0 ? he.importOk(count) : he.importNone);
    } catch {
      showToast(he.saveFailed);
    }
  };

  return (
    <header className="app-bar">
      <div className="brand">
        <h1>{he.appTitle}</h1>
        <p>{he.orgName}</p>
      </div>
      <nav className="tabs" aria-label={he.appTitle}>
        <Link className={location.pathname === '/' ? 'tab is-active' : 'tab'} to="/" aria-current={location.pathname === '/' ? 'page' : undefined}>
          {he.navCalendar}
        </Link>
        <Link className={onAdd ? 'tab is-active' : 'tab'} to="/add" aria-current={onAdd ? 'page' : undefined}>
          {he.navAdd}
        </Link>
      </nav>
      <div className="bar-tools">
        {session.configured ? (
          <>
            {session.email ? (
              <span className="user-email" title={session.email}>
                {session.email}
              </span>
            ) : null}
            <button type="button" className="text-btn" onClick={() => void session.signOut()}>
              {he.signOut}
            </button>
          </>
        ) : null}
        <Popover.Root>
          <Popover.Trigger className="text-btn" aria-label={he.menuLabel}>
            ⋯
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content className="popover menu-popover" align="end" sideOffset={6}>
              <button type="button" className="menu-item" onClick={onExport}>
                {he.exportJson}
              </button>
              <button type="button" className="menu-item" onClick={() => fileRef.current?.click()}>
                {he.importJson}
              </button>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
      <input
        ref={fileRef}
        hidden
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void onImport(file);
        }}
      />
    </header>
  );
}
