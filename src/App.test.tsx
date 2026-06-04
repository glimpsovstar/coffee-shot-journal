import 'fake-indexeddb/auto';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { seedShots } from './data/seed';
import { resetDbForTests } from './storage/db';
import { clearJournalForTests } from './storage/journalRepository';

describe('App', () => {
  beforeEach(async () => {
    resetDbForTests();
    await clearJournalForTests();
    resetDbForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders header, catalogue, and seed shots', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Coffee Shot Journal' })).toBeInTheDocument();
    });

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

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Log a shot' })).toBeInTheDocument();
    });

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

    await waitFor(() => {
      const shotSection = screen.getByRole('heading', { name: 'Espresso shots' }).closest('section')!;
      expect(within(shotSection).getAllByRole('listitem')).toHaveLength(initialCount + 1);
    });

    const shotSection = screen.getByRole('heading', { name: 'Espresso shots' }).closest('section')!;
    const items = within(shotSection).getAllByRole('listitem');

    expect(within(items[0]).getByRole('heading', { level: 3 })).toHaveTextContent('House Espresso');
    expect(within(items[0]).getByText('Great pull.')).toBeInTheDocument();
  });

  it('adds a new bean to the catalogue', async () => {
    vi.stubGlobal('crypto', {
      randomUUID: () => 'new-bean-id',
    });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Add a bean' })).toBeInTheDocument();
    });

    const form = screen.getByRole('heading', { name: 'Add a bean' }).closest('section')!;

    await user.type(within(form).getByLabelText('Name'), 'Catalogue Test');
    await user.type(within(form).getByLabelText('Roaster'), 'Demo Roasters');
    await user.type(within(form).getByLabelText('Origin / blend summary'), 'Guatemala');
    await user.type(within(form).getByLabelText('Roast date'), '2026-05-15');
    await user.clear(within(form).getByLabelText('Purchased'));
    await user.type(within(form).getByLabelText('Purchased'), '2026-05-16');
    await user.click(within(form).getByRole('button', { name: 'Add bean' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Catalogue Test' })).toBeInTheDocument();
    });
  });
});
