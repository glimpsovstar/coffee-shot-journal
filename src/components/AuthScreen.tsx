import { useState } from 'react';

interface AuthScreenProps {
  error: string | null;
  onSignInWithPasskey: () => Promise<void>;
}

export function AuthScreen({ error, onSignInWithPasskey }: AuthScreenProps) {
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLocalError(null);
    setSubmitting(true);
    try {
      await onSignInWithPasskey();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const message = localError ?? error;

  return (
    <div className="app app--auth">
      <header className="app-header">
        <h1>Coffee Shot Journal</h1>
        <p>Sign in with your passkey to access your cloud journal on this device.</p>
      </header>

      <section className="auth-panel" aria-labelledby="auth-heading">
        <h2 id="auth-heading">Sign in</h2>
        <p>
          Use Face ID, Touch ID, or your device passkey. On a laptop without a local passkey, choose
          &ldquo;Use a phone or tablet&rdquo; when prompted and scan the QR code with your phone.
        </p>

        <div className="auth-panel__actions">
          <button
            type="button"
            className="btn-primary"
            disabled={submitting}
            onClick={handleSignIn}
          >
            {submitting ? 'Signing in…' : 'Sign in with passkey'}
          </button>
        </div>

        {message ? (
          <p className="auth-panel__error" role="alert">{message}</p>
        ) : null}

        <div className="auth-panel__hint">
          <p><strong>No passkey yet?</strong> You must sign in once before you can register one.</p>
          <ol>
            <li>
              Supabase Dashboard → <strong>Authentication → Users</strong> → your user → confirm email
              is verified.
            </li>
            <li>
              Send a <strong>magic link</strong> to your email (or use password recovery if a password
              is set).
            </li>
            <li>
              Open the link on your phone — you should land in the journal (brief signed-in session).
            </li>
            <li>
              Tap <strong>Add passkey to this device</strong> in the header, then Face ID / Touch ID.
            </li>
            <li>Next visits: use <strong>Sign in with passkey</strong>.</li>
          </ol>
          <p>
            Or manage passkeys under Authentication → Users in Supabase (break-glass).
          </p>
        </div>
      </section>
    </div>
  );
}
