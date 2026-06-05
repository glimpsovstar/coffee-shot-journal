import type { IDBPDatabase } from 'idb';
import { seedBeans, seedShots } from '../data/seed';
import type { Bean, Shot } from '../types';
import { normalizeBean } from '../utils/beans';
import { getDb, JOURNAL_KEY, resetDbForTests, type JournalDB } from './db';

export interface JournalData {
  beans: Bean[];
  shots: Shot[];
}

/** DB v1 layout (meta store only). */
interface LegacyJournalDB extends JournalDB {
  meta: {
    key: 'beans' | 'shots';
    value: Bean[] | Shot[];
  };
}

function normalizeBeans(beans: Bean[]): Bean[] {
  return beans.map((bean) => normalizeBean({ ...bean, photos: bean.photos ?? [] }));
}

function normalizeShots(shots: Shot[]): Shot[] {
  return shots.map((shot) => {
    const normalized: Shot = { ...shot, photos: shot.photos ?? [] };
    if (!normalized.brewedLocation?.trim()) {
      delete normalized.brewedLocation;
    }
    if (!normalized.brewSuburb?.id) {
      delete normalized.brewSuburb;
    }
    if (!normalized.weather?.description) {
      delete normalized.weather;
    }
    return normalized;
  });
}

/** Read beans/shots from pre-v2 `meta` store when the upgraded DB still has one. */
async function readLegacyMetaIfPresent(
  db: Awaited<ReturnType<typeof getDb>>,
): Promise<JournalData | null> {
  if (!([...db.objectStoreNames] as string[]).includes('meta')) {
    return null;
  }

  const legacyDb = db as unknown as IDBPDatabase<LegacyJournalDB>;
  const tx = legacyDb.transaction('meta', 'readonly');
  const meta = tx.objectStore('meta');
  const legacyBeans = (await meta.get('beans')) as Bean[] | undefined;
  const legacyShots = (await meta.get('shots')) as Shot[] | undefined;
  await tx.done;

  if (legacyBeans === undefined && legacyShots === undefined) {
    return null;
  }

  return {
    beans: normalizeBeans(legacyBeans ?? seedBeans),
    shots: normalizeShots(legacyShots ?? seedShots),
  };
}

function hasChanges<T>(current: T, normalized: T): boolean {
  return JSON.stringify(current) !== JSON.stringify(normalized);
}

async function clearLegacyMetaIfPresent(db: Awaited<ReturnType<typeof getDb>>): Promise<void> {
  if (!([...db.objectStoreNames] as string[]).includes('meta')) {
    return;
  }

  const legacyDb = db as unknown as IDBPDatabase<LegacyJournalDB>;
  const tx = legacyDb.transaction('meta', 'readwrite');
  const meta = tx.objectStore('meta');
  await meta.delete('beans');
  await meta.delete('shots');
  await tx.done;
}

export async function loadJournal(): Promise<JournalData> {
  const db = await getDb();

  const beans = await db.get('beans', JOURNAL_KEY);
  const shots = await db.get('shots', JOURNAL_KEY);
  const legacy = await readLegacyMetaIfPresent(db);

  const source = {
    beans: beans ?? legacy?.beans ?? seedBeans,
    shots: shots ?? legacy?.shots ?? seedShots,
  };
  const normalized = {
    beans: normalizeBeans(source.beans),
    shots: normalizeShots(source.shots),
  };

  const shouldSaveBeans = beans === undefined || hasChanges(beans, normalized.beans);
  const shouldSaveShots = shots === undefined || hasChanges(shots, normalized.shots);

  if (shouldSaveBeans) {
    await saveBeans(normalized.beans);
  }
  if (shouldSaveShots) {
    await saveShots(normalized.shots);
  }
  if (legacy) {
    await clearLegacyMetaIfPresent(db);
  }

  return normalized;
}

export async function saveBeans(beans: Bean[]): Promise<void> {
  const db = await getDb();
  await db.put('beans', beans, JOURNAL_KEY);
}

export async function saveShots(shots: Shot[]): Promise<void> {
  const db = await getDb();
  await db.put('shots', shots, JOURNAL_KEY);
}

export async function putPhotoBlob(photoId: string, blob: Blob): Promise<void> {
  const db = await getDb();
  await db.put(
    'photoBlobs',
    { mimeType: blob.type, data: await blob.arrayBuffer() },
    photoId,
  );
}

export async function getPhotoBlob(photoId: string): Promise<Blob | undefined> {
  const db = await getDb();
  const record = await db.get('photoBlobs', photoId);
  if (!record) return undefined;
  return new Blob([record.data], { type: record.mimeType });
}

export async function deletePhotoBlob(photoId: string): Promise<void> {
  const db = await getDb();
  await db.delete('photoBlobs', photoId);
}

export async function clearJournalForTests(): Promise<void> {
  const db = await getDb();
  await db.clear('beans');
  await db.clear('shots');
  await db.clear('photoBlobs');
  resetDbForTests();
}

export { resetDbForTests };
