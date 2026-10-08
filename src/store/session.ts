import { createContext, useContext } from 'react';

export interface SessionValue {
  configured: boolean;
  email: string | null;
  signOut: () => Promise<void>;
}

export const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('session');
  return value;
}
