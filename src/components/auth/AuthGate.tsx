import { useEffect, useState, type ReactNode } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { he } from '../../i18n/he.ts';
import { SignInPage } from '../../pages/SignInPage.tsx';
import { supabase } from '../../store/instance.ts';
import { SessionContext } from '../../store/session.ts';
import { checkApproved, signInWithPassword, type SignInResult } from '../../store/signIn.ts';
import { useCalendar } from '../../store/useCalendar.ts';

const FAILURE_TEXT: Record<Exclude<SignInResult, 'ok'>, string> = {
  bad: he.authBad,
  later: he.authLater,
  unavailable: he.authUnavailable,
  denied: he.authDenied,
};

function StoreBoot({ children }: { children: ReactNode }) {
  const init = useCalendar((state) => state.init);
  useEffect(() => init(), [init]);
  return children;
}

function RemoteGate({ client, children }: { client: SupabaseClient; children: ReactNode }) {
  const [phase, setPhase] = useState<'loading' | 'signedOut' | 'ready'>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    let generation = 0;
    let opened = false;

    const apply = async (session: Session | null, token: number) => {
      if (cancel || token !== generation) return;
      opened = true;
      if (!session) {
        setEmail(null);
        setPhase('signedOut');
        return;
      }
      const verdict = await checkApproved(client);
      if (cancel || token !== generation) return;
      if (verdict === 'approved') {
        setEmail(session.user.email || null);
        setError(null);
        setPhase('ready');
        return;
      }
      setEmail(null);
      setError(verdict === 'denied' ? he.authDenied : he.authUnavailable);
      setPhase('signedOut');
      await client.auth.signOut();
    };

    // A supabase call inside onAuthStateChange deadlocks the auth lock, so the check waits until the callback returns.
    const schedule = (session: Session | null) => {
      const token = ++generation;
      window.setTimeout(() => {
        void apply(session, token);
      }, 0);
    };

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      schedule(session);
    });

    void client.auth.getSession().then(
      ({ data: sessionData, error: sessionError }) => {
        if (cancel) return;
        if (sessionError) {
          opened = true;
          setError(he.authUnavailable);
          setPhase('signedOut');
          return;
        }
        schedule(sessionData.session);
      },
      () => {
        if (cancel) return;
        opened = true;
        setError(he.authUnavailable);
        setPhase('signedOut');
      },
    );

    const hang = window.setTimeout(() => {
      if (cancel || opened) return;
      opened = true;
      setError(he.authUnavailable);
      setPhase('signedOut');
    }, 8000);

    return () => {
      cancel = true;
      generation += 1;
      window.clearTimeout(hang);
      data.subscription.unsubscribe();
    };
  }, [client]);

  if (phase === 'loading') {
    return (
      <div className="gate">
        <p className="gate-status">{he.loading}</p>
      </div>
    );
  }

  if (phase === 'signedOut') {
    return (
      <SignInPage
        error={error}
        onSubmit={async (emailValue, password) => {
          setError(null);
          const result = await signInWithPassword(client, emailValue, password);
          if (result === 'ok') return;
          setError(FAILURE_TEXT[result]);
        }}
      />
    );
  }

  return (
    <SessionContext.Provider
      value={{
        configured: true,
        email,
        signOut: async () => {
          await client.auth.signOut();
        },
      }}
    >
      <StoreBoot>{children}</StoreBoot>
    </SessionContext.Provider>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  if (!supabase) {
    return (
      <SessionContext.Provider value={{ configured: false, email: null, signOut: async () => undefined }}>
        <StoreBoot>{children}</StoreBoot>
      </SessionContext.Provider>
    );
  }
  return <RemoteGate client={supabase}>{children}</RemoteGate>;
}
