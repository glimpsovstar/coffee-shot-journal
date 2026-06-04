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
  return shots.map((shot) => ({ ...shot, photos: shot.photos ?? [] }));
}

/** Copy beans/shots from pre-v2 `meta` store (opened at DB version 1). */
async function migrateLegacyMetaIfPresent(
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

  const data = {
    beans: normalizeBeans(legacyBeans ?? seedBeans),
    shots: normalizeShots(legacyShots ?? seedShots),
  };

  await saveBeans(data.beans);
  await saveShots(data.shots);
  return data;
}

export async function loadJournal(): Promise<JournalData> {
  const db = await getDb();

  const legacy = await migrateLegacyMetaIfPresent(db);
  if (legacy) {
    return legacy;
  }

  const beans = await db.get('beans', JOURNAL_KEY);
  const shots = await db.get('shots', JOURNAL_KEY);

  if (beans !== undefined && shots !== undefined) {
    const normalized = {
      beans: normalizeBeans(beans),
      shots: normalizeShots(shots),
    };
    const needsMigration = beans.some(
      (b, i) => JSON.stringify(b) !== JSON.stringify(normalized.beans[i]),
    );
    if (needsMigration) {
      await saveBeans(normalized.beans);
      await saveShots(normalized.shots);
    }
    return normalized;
  }

  const initial = { beans: seedBeans, shots: seedShots };
  await saveBeans(initial.beans);
  await saveShots(initial.shots);
  return initial;
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
