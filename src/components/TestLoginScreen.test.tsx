import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TestLoginScreen } from './TestLoginScreen';

describe('TestLoginScreen', () => {
  it('renders beta tester email/password form', () => {
    render(
      <TestLoginScreen error={null} onSignInWithPassword={vi.fn().mockResolvedValue(undefined)} />,
    );

    expect(screen.getByRole('heading', { name: 'Beta tester sign-in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Use the main sign-in page' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('submits credentials via handler', async () => {
    const onSignIn = vi.fn().mockResolvedValue(undefined);
    const replace = vi.fn();
    vi.stubGlobal('location', { ...window.location, replace });

    const user = userEvent.setup();
    render(<TestLoginScreen error={null} onSignInWithPassword={onSignIn} />);

    await user.type(screen.getByLabelText('Email'), 'tester@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret-pass');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(onSignIn).toHaveBeenCalledWith('tester@example.com', 'secret-pass');
    expect(replace).toHaveBeenCalledWith('/');

    vi.unstubAllGlobals();
  });

  it('shows error when sign-in fails', async () => {
    const onSignIn = vi
      .fn()
      .mockRejectedValue(new Error('Invalid login credentials'));
    const user = userEvent.setup();

    render(<TestLoginScreen error={null} onSignInWithPassword={onSignIn} />);

    await user.type(screen.getByLabelText('Email'), 'tester@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/Email or password is incorrect/i);
  });
});
