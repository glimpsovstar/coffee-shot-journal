import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { seedBeans, seedShots } from '../data/seed';
import { resetDbForTests } from '../storage/db';
import { clearJournalForTests, saveBeans, saveShots } from '../storage/journalRepository';
import { hasCustomLocalJournal, importLocalJournalToCloud } from './cloudImport';

describe('cloudImport', () => {
  beforeEach(async () => {
    resetDbForTests();
    await clearJournalForTests();
    resetDbForTests();
  });

  it('does not treat empty IndexedDB as a custom local journal', async () => {
    expect(await hasCustomLocalJournal()).toBe(false);
  });

  it('detects custom local journal when IndexedDB differs from seed', async () => {
    await saveBeans([{ ...seedBeans[0], name: 'My bean' }, ...seedBeans.slice(1)]);
    await saveShots(seedShots);

    expect(await hasCustomLocalJournal()).toBe(true);
  });

  it('does not treat seed-only IndexedDB as custom', async () => {
    await saveBeans(seedBeans);
    await saveShots(seedShots);

    expect(await hasCustomLocalJournal()).toBe(false);
  });

  it('refuses to import when there is no local journal', async () => {
    await expect(importLocalJournalToCloud('user-1')).rejects.toThrow(
      'No local journal on this device to import.',
    );
  });
});
