import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSupabasePublishableKey, getSupabaseUrl, isCloudEnabled } from './cloudConfig';

describe('cloudConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads VITE_ env names', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abc.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
    expect(getSupabaseUrl()).toBe('https://abc.supabase.co');
    expect(getSupabasePublishableKey()).toBe('sb_publishable_test');
    expect(isCloudEnabled()).toBe(true);
  });

  it('falls back to NEXT_PUBLIC_ env names', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://xyz.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_next');
    expect(getSupabaseUrl()).toBe('https://xyz.supabase.co');
    expect(getSupabasePublishableKey()).toBe('sb_publishable_next');
    expect(isCloudEnabled()).toBe(true);
  });
});
