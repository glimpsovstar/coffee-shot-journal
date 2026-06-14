import { PASSKEY_APP_ORIGIN } from './passkeyOrigin';

type ErrorWithCause = Error & { cause?: unknown };

function nestedMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const cause = (error as ErrorWithCause).cause;
  if (cause instanceof Error && cause.message.trim()) return cause.message.trim();
  return null;
}

/**
 * User-facing auth errors — especially opaque Supabase passkey / WebAuthn messages.
 */
export function formatAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Sign-in failed. Try again or use Continue with Google.';

  const message = error.message.trim();
  const causeMessage = nestedMessage(error);

  if (/non-webauthn related error/i.test(message)) {
    if (causeMessage?.match(/invalid domain|invalid rp id/i)) {
      return `Passkeys only work on ${PASSKEY_APP_ORIGIN} (not this URL). Open that site, or sign in with Google.`;
    }
    if (causeMessage?.match(/not allowed|cancel|abort/i)) {
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

  if (causeMessage) return causeMessage;

  return message || 'Sign-in failed. Try again or use Continue with Google.';
}
