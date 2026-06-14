import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppNav } from './AppNav';

describe('AppNav', () => {
  it('renders primary destinations including Account', () => {
    render(<AppNav page="journal" onPageChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Journal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log shot/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Backup/i })).not.toBeInTheDocument();
  });

  it('calls onPageChange when a tab is clicked', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<AppNav page="journal" onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: /Log shot/i }));
    expect(onPageChange).toHaveBeenCalledWith('log');
  });
});
