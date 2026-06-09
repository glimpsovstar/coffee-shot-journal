import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { seedBeans, seedShots } from '../data/seed';
import { getCloudImportDoneKey } from '../lib/cloudConfig';
import { resetDbForTests } from '../storage/db';
import { clearJournalForTests, saveBeans, saveShots } from '../storage/journalRepository';
import { CloudImportPrompt } from './CloudImportPrompt';

function stubLocalStorage() {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => storage.clear(),
    key: (index: number) => [...storage.keys()][index] ?? null,
    get length() {
      return storage.size;
    },
  });
  return storage;
}

describe('CloudImportPrompt', () => {
  const userId = 'test-user';

  beforeEach(async () => {
    stubLocalStorage();
    resetDbForTests();
    await clearJournalForTests();
    resetDbForTests();

    await saveBeans([{ ...seedBeans[0], name: 'Local only' }, ...seedBeans.slice(1)]);
    await saveShots(seedShots);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hides after skip and does not reappear for the same user', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CloudImportPrompt userId={userId} onImported={() => undefined} />,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Import journal from this device' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Skip' }));

    expect(screen.queryByRole('heading', { name: 'Import journal from this device' })).toBeNull();
    expect(window.localStorage.getItem(getCloudImportDoneKey(userId))).toBe('1');

    rerender(<CloudImportPrompt userId={userId} onImported={() => undefined} />);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Import journal from this device' })).toBeNull();
    });
  });
});
