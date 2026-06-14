import { describe, expect, it } from 'vitest';
import {
  isPasskeyOriginSupported,
  isProductionAppHost,
  isVercelPreviewHost,
  PASSKEY_APP_ORIGIN,
  supabaseRedirectAllowlistEntry,
} from './passkeyOrigin';

describe('app origin helpers', () => {
  it('detects production and preview hosts', () => {
    expect(isProductionAppHost(PASSKEY_APP_ORIGIN)).toBe(true);
    expect(isProductionAppHost('https://coffee-shot-journal.vercel.app')).toBe(false);
    expect(isVercelPreviewHost('coffee-shot-journal-git-main-david-joo-s-projects.vercel.app')).toBe(
      true,
    );
    expect(isVercelPreviewHost('coffeesnob.withdevo.net')).toBe(false);
  });

  it('supports passkeys only on withdevo.net', () => {
    expect(isPasskeyOriginSupported('coffeesnob.withdevo.net')).toBe(true);
    expect(isPasskeyOriginSupported('coffee-shot-journal.vercel.app')).toBe(false);
  });

  it('builds Supabase redirect allowlist pattern', () => {
    expect(supabaseRedirectAllowlistEntry('https://coffee-shot-journal.vercel.app')).toBe(
      'https://coffee-shot-journal.vercel.app/**',
    );
  });
});
