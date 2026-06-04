import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { seedShots } from './data/seed';

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders header, catalogue, and seed shots', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Coffee Shot Journal' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bean catalogue' })).toBeInTheDocument();
    const catalogue = screen
      .getByRole('heading', { name: 'Bean catalogue' })
      .closest('section')!;
    expect(
      within(catalogue).getByRole('heading', { name: 'Ethiopia Yirgacheffe' }),
    ).toBeInTheDocument();

    const shotList = screen.getByRole('heading', { name: 'Espresso shots' }).closest('section');
    expect(shotList).toBeTruthy();
    expect(within(shotList!).getAllByRole('listitem')).toHaveLength(seedShots.length);
  });

  it('adds a new shot to the top of the list', async () => {
    vi.stubGlobal('crypto', {
      randomUUID: () => 'new-shot-id',
    });

    const user = userEvent.setup();
    render(<App />);

    const initialCount = within(
      screen.getByRole('heading', { name: 'Espresso shots' }).closest('section')!,
    ).getAllByRole('listitem').length;

    const form = screen.getByRole('heading', { name: 'Log a shot' }).closest('section')!;

    await user.type(within(form).getByLabelText('Grind setting'), '15');
    await user.clear(within(form).getByLabelText('Brewed'));
    await user.type(within(form).getByLabelText('Brewed'), '2026-06-05T12:00');
    await user.selectOptions(within(form).getByLabelText('Bean'), 'bean-house');
    await user.type(within(form).getByLabelText('Tasting notes'), 'Great pull.');
    await user.click(within(form).getByRole('button', { name: 'Add shot' }));

    const shotSection = screen.getByRole('heading', { name: 'Espresso shots' }).closest('section')!;
    const items = within(shotSection).getAllByRole('listitem');

    expect(items).toHaveLength(initialCount + 1);
    expect(within(items[0]).getByRole('heading', { level: 3 })).toHaveTextContent('House Espresso');
    expect(within(items[0]).getByText('Great pull.')).toBeInTheDocument();
    expect(within(items[0]).getByRole('time')).toHaveAttribute(
      'dateTime',
      new Date('2026-06-05T12:00').toISOString(),
    );
  });
});
