import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { checkApproved, mapAuthFailure, signInWithPassword } from './signIn.ts';

describe('mapAuthFailure', () => {
  it('treats a wrong password as a bad sign-in', () => {
    expect(mapAuthFailure({ message: 'Invalid login credentials' })).toBe('bad');
  });

  it('treats a rate limit as a wait', () => {
    expect(mapAuthFailure({ message: 'Too many requests' })).toBe('later');
  });

  it('treats a dropped network as unavailable', () => {
    expect(mapAuthFailure({ name: 'AuthRetryableFetchError', message: 'Failed to fetch' })).toBe('unavailable');
  });
});

describe('checkApproved', () => {
  it('accepts only a true result', async () => {
    const approved = { rpc: async () => ({ data: true, error: null }) } as unknown as SupabaseClient;
    const denied = { rpc: async () => ({ data: false, error: null }) } as unknown as SupabaseClient;
    const down = { rpc: async () => ({ data: null, error: { message: 'down' } }) } as unknown as SupabaseClient;
    await expect(checkApproved(approved)).resolves.toBe('approved');
    await expect(checkApproved(denied)).resolves.toBe('denied');
    await expect(checkApproved(down)).resolves.toBe('unavailable');
  });
});

describe('signInWithPassword', () => {
  it('sends a trimmed lowercase email and signs out when the account is not approved', async () => {
    const emails: string[] = [];
    let signedOut = false;
    const client = {
      auth: {
        signInWithPassword: async ({ email }: { email: string }) => {
          emails.push(email);
          return { error: null };
        },
        signOut: async () => {
          signedOut = true;
        },
      },
      rpc: async () => ({ data: false, error: null }),
    } as unknown as SupabaseClient;

    await expect(signInWithPassword(client, '  Staff@School.org ', 'secret')).resolves.toBe('denied');
    expect(emails).toEqual(['staff@school.org']);
    expect(signedOut).toBe(true);
  });
});
