import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = async (): Promise<SupabaseClient> => {
  if (supabaseInstance) return supabaseInstance;

  const res = await fetch('/api/config');
  if (!res.ok) {
    throw new Error('Failed to fetch config');
  }
  const config = await res.json();

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is missing from the server.');
  }

  supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey);
  return supabaseInstance;
};
