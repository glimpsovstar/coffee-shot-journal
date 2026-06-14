/** Production app URL (passkeys + default OAuth redirect allowlist). */
export const PASSKEY_APP_ORIGIN = 'https://coffeesnob.withdevo.net';

/** Passkeys only work on `withdevo.net` hosts — not localhost or Vercel previews. */
export function isPasskeyOriginSupported(hostname = window.location.hostname): boolean {
  return hostname === 'withdevo.net' || hostname.endsWith('.withdevo.net');
}

/** Vercel preview deployments (`*.vercel.app`). */
export function isVercelPreviewHost(hostname = window.location.hostname): boolean {
  return hostname.endsWith('.vercel.app');
}

export function isProductionAppHost(origin = window.location.origin): boolean {
  return origin === PASSKEY_APP_ORIGIN;
}

/** Redirect URL entry to add in Supabase for the current preview origin. */
export function supabaseRedirectAllowlistEntry(origin = window.location.origin): string {
  return `${origin}/**`;
}
