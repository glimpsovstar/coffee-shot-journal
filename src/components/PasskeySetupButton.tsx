import { useState } from 'react';

interface PasskeySetupButtonProps {
  onRegisterPasskey: () => Promise<void>;
}

export function PasskeySetupButton({ onRegisterPasskey }: PasskeySetupButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      await onRegisterPasskey();
      setMessage('Passkey registered on this device. You can use Face ID / Touch ID next time.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Passkey registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="passkey-setup">
      <button type="button" className="btn-secondary" disabled={loading} onClick={handleRegister}>
        {loading ? 'Registering…' : 'Add passkey'}
      </button>
      {message ? <p className="passkey-setup__message">{message}</p> : null}
      {error ? (
        <p className="passkey-setup__error" role="alert">{error}</p>
      ) : null}
    </div>
  );
}
