import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AppBar } from './components/ui/AppBar.tsx';
import { ToastHost } from './components/ui/ToastHost.tsx';
import { AddEventPage } from './pages/AddEventPage.tsx';
import { CalendarPage } from './pages/CalendarPage.tsx';
import { useCalendar } from './store/useCalendar.ts';

function AddRoute() {
  const { pathname } = useLocation();
  return <AddEventPage key={pathname} />;
}

export default function App() {
  const init = useCalendar((state) => state.init);
  useEffect(() => init(), [init]);

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="app">
        <AppBar />
        <main className="shell-main">
          <Routes>
            <Route path="/" element={<CalendarPage />} />
            <Route path="/add" element={<AddRoute />} />
            <Route path="/edit/:id" element={<AddRoute />} />
          </Routes>
        </main>
        <ToastHost />
      </div>
    </Tooltip.Provider>
  );
}
