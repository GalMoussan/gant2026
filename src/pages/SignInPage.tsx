import { useState, type FormEvent } from 'react';
import { he } from '../i18n/he.ts';

interface SignInPageProps {
  error: string | null;
  onSubmit: (email: string, password: string) => Promise<void>;
}

export function SignInPage({ error, onSubmit }: SignInPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const shown = localError ?? error;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    if (!email.trim() || !password) {
      setLocalError(he.authRequired);
      return;
    }
    setLocalError(null);
    setPending(true);
    void onSubmit(email, password).finally(() => setPending(false));
  };

  return (
    <div className="gate">
      <form className="gate-card" onSubmit={submit} noValidate>
        <h1>{he.signInTitle}</h1>
        <p className="gate-lead">{he.signInLead}</p>
        <label className="field">
          <span className="field-label">{he.fieldEmail}</span>
          <input
            id="sign-in-email"
            name="email"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            value={email}
            aria-invalid={shown ? true : undefined}
            aria-describedby={shown ? 'sign-in-error' : undefined}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">{he.fieldPassword}</span>
          <input
            id="sign-in-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            aria-invalid={shown ? true : undefined}
            aria-describedby={shown ? 'sign-in-error' : undefined}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {shown ? (
          <p id="sign-in-error" className="field-error" role="alert">
            {shown}
          </p>
        ) : null}
        <button type="submit" className="primary-btn" disabled={pending} aria-busy={pending}>
          {pending ? he.signInPending : he.signInSubmit}
        </button>
        <p className="gate-help">{he.authHelp}</p>
      </form>
    </div>
  );
}
