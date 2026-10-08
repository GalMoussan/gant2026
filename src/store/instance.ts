import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createLocalEventStore } from './localEventStore.ts';
import { createSupabaseEventStore } from './supabaseEventStore.ts';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

/** Null when the site is running with browser-only storage. */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export const eventStore = supabase ? createSupabaseEventStore(supabase) : createLocalEventStore();
