import { PASSKEY_APP_ORIGIN } from './passkeyOrigin';

type ErrorWithCause = Error & { cause?: unknown };

function nestedMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const cause = (error as ErrorWithCause).cause;
  if (cause instanceof Error && cause.message.trim()) return cause.message.trim();
  return null;
}

function decodeOAuthErrorText(text: string): string {
  try {
    return decodeURIComponent(text.replace(/\+/g, ' ')).trim();
  } catch {
    return text.trim();
  }
}

/**
 * User-facing auth errors — especially opaque Supabase passkey / WebAuthn messages.
 */
export function formatAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Sign-in failed. Try again or use Continue with Google.';

  const message = decodeOAuthErrorText(error.message);
  const causeMessage = nestedMessage(error);
  const causeText = causeMessage ? decodeOAuthErrorText(causeMessage) : null;

  if (/unable to exchange external code/i.test(message)) {
    return (
      'Google sign-in failed while exchanging the authorization code. In Supabase → Authentication → ' +
      'Providers → Google, re-paste the Client ID and Client Secret from the **same** Google OAuth client ' +
      '(no spaces). In Google Cloud, the only redirect URI should be ' +
      'https://rqkzobpqmfdxeliyohec.supabase.co/auth/v1/callback — then Save and try again in incognito.'
    );
  }

  if (/non-webauthn related error/i.test(message)) {
    if (causeText?.match(/invalid domain|invalid rp id/i)) {
      return `Passkeys only work on ${PASSKEY_APP_ORIGIN} (not this URL). Open that site, or sign in with Google.`;
    }
    if (causeText?.match(/not allowed|cancel|abort/i)) {
      return 'Passkey sign-in was cancelled. Try again, or use Continue with Google.';
    }
    return (
      'Passkey sign-in did not complete. If you have not added a passkey yet, use Continue with Google first, ' +
      'then add one under Backup & restore. Otherwise open ' +
      PASSKEY_APP_ORIGIN +
      ' (not a preview URL).'
    );
  }

  if (/webauthn_credential_not_found/i.test(message)) {
    return 'No passkey found for this site. Sign in with Google, then add a passkey under Backup & restore.';
  }

  if (/passkey_disabled/i.test(message)) {
    return 'Passkeys are disabled on this project. Sign in with Google or GitHub.';
  }

  if (/missing oauth secret/i.test(message)) {
    return (
      'Google Client Secret is missing in Supabase. Open Authentication → Providers → Google, paste the secret ' +
      'from Google Cloud (same OAuth client as the Client ID), and click Save.'
    );
  }

  if (
    /redirect.*not allowed|redirect_uri|oauth.*redirect|invalid.*redirect/i.test(message) ||
    (causeText && /redirect.*not allowed|redirect_uri/i.test(causeText))
  ) {
    return (
      'This sign-in URL is not allowed in Supabase. On Vercel previews, add this preview URL under ' +
      'Authentication → URL Configuration → Redirect URLs, or sign in on ' +
      PASSKEY_APP_ORIGIN +
      '.'
    );
  }

  if (causeText) return causeText;

  return message || 'Sign-in failed. Try again or use Continue with Google.';
}

/** Read OAuth error params Supabase appends to the URL after a failed redirect. */
export function readOAuthCallbackError(): string | null {
  const fromSearch = new URLSearchParams(window.location.search);
  const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const raw =
    fromSearch.get('error_description') ??
    fromHash.get('error_description') ??
    fromSearch.get('error') ??
    fromHash.get('error');
  if (!raw) return null;
  return formatAuthErrorMessage(new Error(decodeOAuthErrorText(raw)));
}

export function clearOAuthCallbackParams(): void {
  const url = new URL(window.location.href);
  const oauthKeys = ['error', 'error_code', 'error_description'];
  for (const key of oauthKeys) {
    url.searchParams.delete(key);
  }
  if (url.hash) {
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
    for (const key of oauthKeys) {
      hashParams.delete(key);
    }
    const remainder = hashParams.toString();
    url.hash = remainder ? `#${remainder}` : '';
  }
  if (url.href !== window.location.href) {
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  }
}
