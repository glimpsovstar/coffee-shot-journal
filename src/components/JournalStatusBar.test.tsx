import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JournalStatusBar } from './JournalStatusBar';

describe('JournalStatusBar', () => {
  it('shows shot count and current bean', () => {
    render(
      <JournalStatusBar shotCount={42} currentBeanLabel="Outsider Coffee — Manta Ray" />,
    );

    expect(screen.getByText('42', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Manta Ray', { exact: false })).toBeInTheDocument();
  });

  it('omits current bean when not provided', () => {
    render(<JournalStatusBar shotCount={0} />);

    expect(screen.getByText('0', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(/Current bean/i)).not.toBeInTheDocument();
  });
});
