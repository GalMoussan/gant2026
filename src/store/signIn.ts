import type { SupabaseClient } from '@supabase/supabase-js';

export type SignInResult = 'ok' | 'bad' | 'later' | 'unavailable' | 'denied';

export function mapAuthFailure(error: { message: string; name?: string }): Exclude<SignInResult, 'ok' | 'denied'> {
  const text = `${error.name ?? ''} ${error.message}`.toLowerCase();
  if (text.includes('rate') || text.includes('too many')) return 'later';
  if (text.includes('fetch') || text.includes('network') || text.includes('failed')) return 'unavailable';
  return 'bad';
}

export async function checkApproved(client: SupabaseClient): Promise<'approved' | 'denied' | 'unavailable'> {
  const { data, error } = await client.rpc('is_approved');
  if (error) return 'unavailable';
  return data === true ? 'approved' : 'denied';
}

export async function signInWithPassword(client: SupabaseClient, email: string, password: string): Promise<SignInResult> {
  const { error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return mapAuthFailure(error);
  const verdict = await checkApproved(client);
  if (verdict === 'approved') return 'ok';
  await client.auth.signOut();
  return verdict === 'denied' ? 'denied' : 'unavailable';
}
