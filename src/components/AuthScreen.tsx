import { useState } from 'react';

interface AuthScreenProps {
  error: string | null;
  onSignInWithPasskey: () => Promise<void>;
  onRegisterPasskey: () => Promise<void>;
}

export function AuthScreen({ error, onSignInWithPasskey, onRegisterPasskey }: AuthScreenProps) {
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

  const handleRegister = async () => {
    setLocalError(null);
    setSubmitting(true);
    try {
      await onRegisterPasskey();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Passkey registration failed.');
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
          <button
            type="button"
            className="btn-secondary"
            disabled={submitting}
            onClick={handleRegister}
          >
            Register a new passkey
          </button>
        </div>

        {message ? (
          <p className="auth-panel__error" role="alert">{message}</p>
        ) : null}

        <p className="auth-panel__hint">
          First time? Register a passkey on your phone at{' '}
          <strong>https://coffeesnob.withdevo.net</strong> after your Supabase user exists. If sign-in
          fails, add a passkey in the Supabase dashboard (Auth → Users).
        </p>
      </section>
    </div>
  );
}
