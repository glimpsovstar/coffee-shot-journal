import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { seedBeans, seedShots } from '../data/seed';
import { markCloudImportPromptHandled } from '../lib/cloudConfig';
import { resetDbForTests } from '../storage/db';
import { clearJournalForTests, saveBeans, saveShots } from '../storage/journalRepository';
import { loadJournalFromCloud } from '../storage/supabaseJournalRepository';
import {
  hasCustomLocalJournal,
  importLocalJournalToCloud,
  shouldOfferCloudImportPrompt,
} from './cloudImport';

vi.mock('../storage/supabaseJournalRepository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../storage/supabaseJournalRepository')>();
  return {
    ...actual,
    loadJournalFromCloud: vi.fn(),
  };
});

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

  it('does not offer import when cloud already has journal data', async () => {
    vi.mocked(loadJournalFromCloud).mockResolvedValue({
      beans: [{ ...seedBeans[0] }],
      shots: [],
      cafes: [],
    });

    await saveBeans([{ ...seedBeans[0], name: 'Local only' }, ...seedBeans.slice(1)]);
    await saveShots(seedShots);

    expect(await shouldOfferCloudImportPrompt('user-1')).toBe(false);
  });

  it('offers import when cloud is empty and local has custom entries', async () => {
    vi.mocked(loadJournalFromCloud).mockResolvedValue({ beans: [], shots: [], cafes: [] });

    await saveBeans([{ ...seedBeans[0], name: 'Local only' }, ...seedBeans.slice(1)]);
    await saveShots(seedShots);

    expect(await shouldOfferCloudImportPrompt('user-2')).toBe(true);
  });

  it('does not offer import after prompt was handled', async () => {
    vi.mocked(loadJournalFromCloud).mockResolvedValue({ beans: [], shots: [], cafes: [] });
    markCloudImportPromptHandled('user-3');

    await saveBeans([{ ...seedBeans[0], name: 'Local only' }, ...seedBeans.slice(1)]);
    await saveShots(seedShots);

    expect(await shouldOfferCloudImportPrompt('user-3')).toBe(false);
  });
});
