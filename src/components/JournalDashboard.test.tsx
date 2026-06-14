import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { JournalDashboard } from './JournalDashboard';

describe('JournalDashboard', () => {
  it('shows shot stats and latest label', () => {
    render(
      <JournalDashboard
        shotCount={42}
        homeShotCount={30}
        cafeShotCount={12}
        currentBeanLabel="Outsider Coffee — Manta Ray"
        onLogClick={vi.fn()}
      />,
    );

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Manta Ray', { exact: false })).toBeInTheDocument();
  });

  it('invokes onLogClick from CTA', async () => {
    const onLogClick = vi.fn();
    const user = userEvent.setup();
    render(
      <JournalDashboard
        shotCount={1}
        homeShotCount={1}
        cafeShotCount={0}
        onLogClick={onLogClick}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Log a pull' }));
    expect(onLogClick).toHaveBeenCalledOnce();
  });
});
