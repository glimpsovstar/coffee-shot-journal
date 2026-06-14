/** Production hostname for passkeys (RP ID is `withdevo.net`). */
export const PASSKEY_APP_ORIGIN = 'https://coffeesnob.withdevo.net';

/** Passkeys only work on `withdevo.net` hosts — not localhost or arbitrary Vercel previews. */
export function isPasskeyOriginSupported(): boolean {
  const host = window.location.hostname;
  return host === 'withdevo.net' || host.endsWith('.withdevo.net');
}
