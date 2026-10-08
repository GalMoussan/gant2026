import { useState } from 'react';
import { he } from '../../i18n/he.ts';

interface ConfirmDeleteProps {
  onConfirm: () => void;
  label?: string;
}

export function ConfirmDelete({ onConfirm, label }: ConfirmDeleteProps) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button type="button" className="text-btn" onClick={() => setArmed(true)}>
        {label ?? he.delete}
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span>{he.deleteAsk}</span>
      <button type="button" className="text-btn" style={{ color: 'var(--danger)' }} onClick={onConfirm}>
        {he.deleteYes}
      </button>
      <button type="button" className="text-btn" onClick={() => setArmed(false)}>
        {he.deleteNo}
      </button>
    </span>
  );
}
