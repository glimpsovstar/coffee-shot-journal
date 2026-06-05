import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { seedBeans, seedShots } from '../data/seed';
import type { Bean, Photo, Shot } from '../types';
import { DB_NAME, resetDbForTests } from './db';
import {
  clearJournalForTests,
  deletePhotoBlob,
  getPhotoBlob,
  loadJournal,
  putPhotoBlob,
  saveBeans,
  saveShots,
} from './journalRepository';

const testPhoto: Photo = {
  id: 'photo-1',
  fileName: 'bag.jpg',
  mimeType: 'image/jpeg',
  createdAt: '2026-06-04T12:00:00.000Z',
};

function requestToPromise<T = unknown>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteDbForTests() {
  resetDbForTests();
  await requestToPromise(indexedDB.deleteDatabase(DB_NAME));
  resetDbForTests();
}

async function seedLegacyMeta(beans: Bean[], shots: Shot[]) {
  await deleteDbForTests();

  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('meta');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put(beans, 'beans');
    tx.objectStore('meta').put(shots, 'shots');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  db.close();
  resetDbForTests();
}

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

  it('does not let stale legacy meta overwrite modern journal data', async () => {
    const legacyBean = { ...seedBeans[0]!, id: 'legacy-bean', name: 'Legacy Bean' };
    const modernBean = { ...seedBeans[0]!, id: 'modern-bean', name: 'Modern Bean' };
    const legacyShot = { ...seedShots[0]!, id: 'legacy-shot' };
    const modernShot = { ...seedShots[0]!, id: 'modern-shot' };

    await seedLegacyMeta([legacyBean], [legacyShot]);
    await loadJournal();
    await saveBeans([modernBean]);
    await saveShots([modernShot]);

    const reloaded = await loadJournal();
    expect(reloaded.beans).toEqual([modernBean]);
    expect(reloaded.shots).toEqual([modernShot]);
  });

  it('preserves existing beans when shots are missing from storage', async () => {
    const customBean = { ...seedBeans[0]!, id: 'custom-bean', name: 'Custom Bean' };
    await saveBeans([customBean]);

    const reloaded = await loadJournal();
    expect(reloaded.beans).toEqual([customBean]);
    expect(reloaded.shots).toEqual(seedShots);
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
    expect(bean?.roastStyle).toBe('medium');
  });

  it('deletes photo blobs', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    await putPhotoBlob('photo-del', blob);
    await deletePhotoBlob('photo-del');

    expect(await getPhotoBlob('photo-del')).toBeUndefined();
  });
});
