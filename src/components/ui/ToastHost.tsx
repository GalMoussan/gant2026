import { useEffect } from 'react';
import { useCalendar } from '../../store/useCalendar.ts';

export function ToastHost() {
  const toast = useCalendar((state) => state.toast);
  const dismissToast = useCalendar((state) => state.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(dismissToast, 6000);
    return () => window.clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast) return null;

  return (
    <div className="toast-viewport" role="status">
      <div className="toast">
        <p className="m-0 font-semibold">{toast.message}</p>
        {toast.actions.length > 0 ? (
          <div className="toast-actions">
            {toast.actions.map((action) => (
              <button key={action.label} type="button" className="toast-action" onClick={() => action.run()}>
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
