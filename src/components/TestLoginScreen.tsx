import { useState, type FormEvent } from 'react';
import { formatAuthErrorMessage } from '../lib/authErrors';
import { BrandedLogo } from './BrandedLogo';

interface TestLoginScreenProps {
  error: string | null;
  onSignInWithPassword: (email: string, password: string) => Promise<void>;
}

export function TestLoginScreen({ error, onSignInWithPassword }: TestLoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const message = localError ?? error;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      await onSignInWithPassword(email.trim(), password);
      window.location.replace('/');
    } catch (err) {
      setLocalError(formatAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing landing--test-login">
      <div className="landing__layout">
        <section className="landing__hero" aria-labelledby="test-login-tagline">
          <BrandedLogo variant="stacked" className="landing__logo" />
          <p id="test-login-tagline" className="landing__tagline">
            You&apos;re trying an early build of the coffee snob. journal — thanks for helping us
            test before wider release.
          </p>
          <ul className="landing__features">
            <li>Use the email and password shared with you</li>
            <li>After sign-in you&apos;ll use the same journal as on the main site</li>
            <li>Your edits stay in your test account — they don&apos;t change the operator&apos;s data</li>
          </ul>
        </section>

        <section
          className="auth-panel landing__auth test-login-panel"
          aria-labelledby="test-login-heading"
        >
          <h2 id="test-login-heading">Beta tester sign-in</h2>
          <p className="auth-panel__intro">
            Invited testers only. Sign in below, then explore Log, Analytics, and your starter
            journal.
          </p>

          <form className="test-login__form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="test-login-email">Email</label>
              <input
                id="test-login-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                disabled={submitting}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="test-login-password">Password</label>
              <input
                id="test-login-password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                disabled={submitting}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="auth-panel__actions test-login__actions">
              <button type="submit" className="btn-primary btn-primary--wide" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>

          <p className="auth-panel__hint auth-panel__hint--compact">
            Operator account?{' '}
            <a href="/">Use the main sign-in page</a> (Google, passkey).
          </p>

          {message ? (
            <p className="auth-panel__error" role="alert">{message}</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
