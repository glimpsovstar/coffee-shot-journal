import type { Provider } from '@supabase/supabase-js';

/** OAuth providers enabled in the app (must also be enabled in Supabase Auth). */
export type OAuthProviderId = 'google' | 'apple' | 'github';

export interface OAuthProviderConfig {
  id: OAuthProviderId;
  label: string;
  /** Short label for narrow layouts */
  shortLabel: string;
}

export const OAUTH_PROVIDERS: OAuthProviderConfig[] = [
  { id: 'google', label: 'Continue with Google', shortLabel: 'Google' },
  { id: 'apple', label: 'Continue with Apple', shortLabel: 'Apple' },
  { id: 'github', label: 'Continue with GitHub', shortLabel: 'GitHub' },
];

export function isOAuthProviderId(value: string): value is OAuthProviderId {
  return OAUTH_PROVIDERS.some((p) => p.id === value);
}

export function toSupabaseProvider(id: OAuthProviderId): Provider {
  return id;
}
