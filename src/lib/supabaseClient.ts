import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isCloudEnabled } from './cloudConfig';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!isCloudEnabled()) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  }

  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL as string;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    client = createClient(url, key, {
      auth: {
        experimental: { passkey: true },
      },
    });
  }

  return client;
}

/** Reset cached client (tests). */
export function resetSupabaseClientForTests(): void {
  client = null;
}
