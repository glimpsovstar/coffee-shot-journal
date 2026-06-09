import { PasskeySetupButton } from './PasskeySetupButton';

interface AccountSignInPanelProps {
  onRegisterPasskey: () => Promise<void>;
}

export function AccountSignInPanel({ onRegisterPasskey }: AccountSignInPanelProps) {
  return (
    <section className="account-panel" aria-labelledby="account-signin-heading">
      <h2 id="account-signin-heading">Sign-in options</h2>
      <p>
        You can always return with <strong>Continue with Google</strong> on the landing page.
        Optionally add a passkey on this device for Face ID, Touch ID, or a security key — then use
        <strong> Sign in with passkey</strong> next time.
      </p>
      <PasskeySetupButton onRegisterPasskey={onRegisterPasskey} />
    </section>
  );
}
