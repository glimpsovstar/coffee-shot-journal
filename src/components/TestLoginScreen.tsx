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
    <div className="landing">
      <div className="landing__layout landing__layout--compact">
        <section className="auth-panel landing__auth test-login" aria-labelledby="test-login-heading">
          <BrandedLogo variant="stacked" className="landing__logo" />
          <h2 id="test-login-heading">Beta tester sign-in</h2>
          <p className="auth-panel__intro">
            Temporary page for invited testers. Use the email and password shared with you. After
            sign-in you will use the journal at the main site URL.
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
            <div className="auth-panel__actions">
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
