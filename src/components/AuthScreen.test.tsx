import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthScreen } from './AuthScreen';

describe('AuthScreen', () => {
  it('renders branded landing and auth options', () => {
    render(
      <AuthScreen
        error={null}
        onSignInWithPasskey={vi.fn()}
        onSignInWithOAuth={vi.fn()}
      />,
    );

    expect(screen.getByRole('img', { name: 'coffee snob.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Create account or sign in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Apple' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with GitHub' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in with passkey' })).toBeInTheDocument();
  });

  it('calls OAuth handler when a social button is clicked', async () => {
    const onOAuth = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <AuthScreen
        error={null}
        onSignInWithPasskey={vi.fn()}
        onSignInWithOAuth={onOAuth}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(onOAuth).toHaveBeenCalledWith('google');
  });
});
