import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { mockBeans } from '../test/fixtures';
import { JournalHero } from './JournalHero';

describe('JournalHero', () => {
  it('shows stats and latest label', () => {
    render(
      <JournalHero
        shots={[]}
        beans={mockBeans}
        shotCount={42}
        homeShotCount={30}
        cafeShotCount={12}
        currentBeanLabel="Outsider Coffee — Manta Ray"
        resolvePhotos={() => []}
        onLogClick={vi.fn()}
      />,
    );

    expect(screen.getByText('42', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('30', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('12', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Manta Ray', { exact: false })).toBeInTheDocument();
  });

  it('invokes onLogClick from CTA', async () => {
    const onLogClick = vi.fn();
    const user = userEvent.setup();
    render(
      <JournalHero
        shots={[]}
        beans={mockBeans}
        shotCount={1}
        homeShotCount={1}
        cafeShotCount={0}
        resolvePhotos={() => []}
        onLogClick={onLogClick}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Log a shot' }));
    expect(onLogClick).toHaveBeenCalledOnce();
  });
});
