import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { seedBeans } from '../data/seed';
import type { Photo } from '../types';
import {
  clearJournalForTests,
  deletePhotoBlob,
  getPhotoBlob,
  loadJournal,
  putPhotoBlob,
  saveBeans,
} from './journalRepository';
import { resetDbForTests } from './db';

const testPhoto: Photo = {
  id: 'photo-1',
  fileName: 'bag.jpg',
  mimeType: 'image/jpeg',
  createdAt: '2026-06-04T12:00:00.000Z',
};

describe('journalRepository', () => {
  beforeEach(async () => {
    resetDbForTests();
    await clearJournalForTests();
    resetDbForTests();
  });

  it('seeds journal on first load', async () => {
    const data = await loadJournal();

    expect(data.beans.length).toBeGreaterThan(0);
    expect(data.shots.length).toBeGreaterThan(0);
    expect(data.beans.every((b) => Array.isArray(b.photos))).toBe(true);
  });

  it('persists bean updates', async () => {
    await loadJournal();
    const updated = seedBeans.map((bean, index) =>
      index === 0 ? { ...bean, photos: [testPhoto] } : bean,
    );
    await saveBeans(updated);

    const reloaded = await loadJournal();
    expect(reloaded.beans[0]?.photos).toEqual([testPhoto]);
  });

  it('stores and retrieves photo blobs', async () => {
    const blob = new Blob(['fake-image'], { type: 'image/jpeg' });
    await putPhotoBlob('photo-1', blob);

    const loaded = await getPhotoBlob('photo-1');
    expect(loaded?.type).toBe('image/jpeg');
    expect(await loaded?.text()).toBe('fake-image');
  });

  it('normalizes legacy beans missing v3 fields on load', async () => {
    await loadJournal();
    const legacy = {
      id: 'legacy-bean',
      name: 'Legacy',
      roaster: 'Old Roaster',
      originOrBlend: 'Kenya',
      roastDate: '2026-04-01',
      tastingNotes: 'Bright',
      photos: [],
    };
    await saveBeans([legacy as unknown as (typeof seedBeans)[0]]);

    const reloaded = await loadJournal();
    const bean = reloaded.beans.find((b) => b.id === 'legacy-bean');
    expect(bean?.purchaseDate).toBe('2026-04-01');
    expect(bean?.bagSize).toBe('250g');
    expect(bean?.kind).toBe('single_origin');
    expect(bean?.blendComponents).toEqual([]);
  });

  it('deletes photo blobs', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    await putPhotoBlob('photo-del', blob);
    await deletePhotoBlob('photo-del');

    expect(await getPhotoBlob('photo-del')).toBeUndefined();
  });
});
