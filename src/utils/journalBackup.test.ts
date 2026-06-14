import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { seedBeans } from '../data/seed';
import { resetDbForTests } from '../storage/db';
import {
  clearJournalForTests,
  putPhotoBlob,
  readJournalFromIndexedDb,
  saveBeans,
  saveCafes,
} from '../storage/journalRepository';
import {
  buildJournalBackupFromIndexedDb,
  journalDataFromBackup,
  parseJournalBackupFile,
  photoBlobsFromBackup,
  restoreJournalBackupToIndexedDb,
} from './journalBackup';

describe('journalBackup', () => {
  beforeEach(async () => {
    resetDbForTests();
    await clearJournalForTests();
    resetDbForTests();
  });

  it('round-trips beans, shots, and photo blobs', async () => {
    const photo = {
      id: 'photo-backup',
      fileName: 'bag.jpg',
      mimeType: 'image/jpeg',
      createdAt: '2026-06-01T00:00:00.000Z',
    };
    const bean = {
      ...seedBeans[0],
      id: 'custom-bean',
      name: 'Backup Test',
      photos: [photo],
    };
    await saveBeans([bean]);

    const blob = new Blob(['photo-bytes'], { type: 'image/jpeg' });
    await putPhotoBlob('photo-backup', blob);

    const backup = await buildJournalBackupFromIndexedDb();
    const json = JSON.stringify(backup);
    const parsed = parseJournalBackupFile(json);

    expect(parsed.beans[0]?.name).toBe('Backup Test');
    expect(parsed.photos).toHaveLength(1);

    await clearJournalForTests();
    resetDbForTests();

    await restoreJournalBackupToIndexedDb(parsed);
    const restored = await readJournalFromIndexedDb();
    expect(restored?.beans[0]?.name).toBe('Backup Test');

    const blobs = photoBlobsFromBackup(parsed);
    expect(await blobs.get('photo-backup')?.text()).toBe('photo-bytes');
    expect(journalDataFromBackup(parsed).shots).toEqual([]);
  });

  it('preserves existing cafés when v1 backup omits cafes array', async () => {
    const existingCafe = {
      id: 'cafe-keep',
      name: 'Keep Café',
      latitude: -36.85,
      longitude: 174.75,
      notes: '',
      photos: [],
    };
    await saveCafes([existingCafe]);

    const v1Backup = parseJournalBackupFile(
      JSON.stringify({
        version: 1,
        exportedAt: '2026-06-01T00:00:00.000Z',
        beans: seedBeans.slice(0, 1),
        shots: [],
        photos: [],
      }),
    );

    await restoreJournalBackupToIndexedDb(v1Backup);
    const restored = await readJournalFromIndexedDb();
    expect(restored?.cafes).toHaveLength(1);
    expect(restored?.cafes[0]?.id).toBe('cafe-keep');
    expect(restored?.cafes[0]?.name).toBe('Keep Café');
  });
});
