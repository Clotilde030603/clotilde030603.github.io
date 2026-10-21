import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getAdminConfig } from './config';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const config = getAdminConfig();
  if (!config) return null;
  client = createClient(config.url, config.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}
