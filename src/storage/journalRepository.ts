import type { IDBPDatabase } from 'idb';
import { seedBeans, seedShots } from '../data/seed';
import type { Bean, Cafe, Shot } from '../types';
import { normalizeBean } from '../utils/beans';
import { normalizeCafe } from '../utils/cafes';
import { isCafeShot } from '../utils/shots';
import { getDb, JOURNAL_KEY, resetDbForTests, type JournalDB } from './db';

export interface JournalData {
  beans: Bean[];
  shots: Shot[];
  cafes: Cafe[];
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

    if (isCafeShot(normalized)) {
      normalized.context = 'cafe_purchased';
      normalized.grinder = '';
      normalized.grindSetting = '';
      normalized.doseIn = 0;
      normalized.yieldOut = 0;
      normalized.extractionTime = 0;
      if (!normalized.beanId) {
        normalized.beanId = '';
      }
      delete normalized.brewSuburb;
      delete normalized.weather;
      delete normalized.brewedLocation;
      if (!normalized.cafeId) {
        delete normalized.cafeId;
      }
      if (!normalized.shotSizeCustom?.trim()) {
        delete normalized.shotSizeCustom;
      }
      if (normalized.wouldOrderAgain === undefined) {
        delete normalized.wouldOrderAgain;
      }
      if (normalized.priceAud === undefined || Number.isNaN(normalized.priceAud)) {
        delete normalized.priceAud;
      }
    } else {
      delete normalized.context;
      delete normalized.cafeId;
      delete normalized.milkCategory;
      delete normalized.beverageType;
      delete normalized.shotSize;
      delete normalized.shotSizeCustom;
      delete normalized.priceAud;
      delete normalized.wouldOrderAgain;
    }

    return normalized;
  });
}

function normalizeCafes(cafes: Cafe[]): Cafe[] {
  return cafes.map((cafe) => normalizeCafe({ ...cafe, photos: cafe.photos ?? [] }));
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
    cafes: [],
  };

  await saveBeans(data.beans);
  await saveShots(data.shots);
  await saveCafes(data.cafes);
  return data;
}

/** Read IndexedDB journal without seeding empty stores (for import/export checks). */
export async function readJournalFromIndexedDb(): Promise<JournalData | null> {
  const db = await getDb();
  const beans = await db.get('beans', JOURNAL_KEY);
  const shots = await db.get('shots', JOURNAL_KEY);
  const cafes = await db.get('cafes', JOURNAL_KEY);

  if (beans === undefined && shots === undefined && cafes === undefined) {
    return null;
  }

  return {
    beans: normalizeBeans(beans ?? []),
    shots: normalizeShots(shots ?? []),
    cafes: normalizeCafes(cafes ?? []),
  };
}

export async function loadJournal(): Promise<JournalData> {
  const db = await getDb();

  const legacy = await migrateLegacyMetaIfPresent(db);
  if (legacy) {
    return legacy;
  }

  const beans = await db.get('beans', JOURNAL_KEY);
  const shots = await db.get('shots', JOURNAL_KEY);
  const cafes = await db.get('cafes', JOURNAL_KEY);

  if (beans !== undefined && shots !== undefined) {
    const normalized = {
      beans: normalizeBeans(beans),
      shots: normalizeShots(shots),
      cafes: normalizeCafes(cafes ?? []),
    };
    const needsMigration =
      beans.some((b, i) => JSON.stringify(b) !== JSON.stringify(normalized.beans[i])) ||
      shots.some((s, i) => JSON.stringify(s) !== JSON.stringify(normalized.shots[i])) ||
      (cafes ?? []).some((c, i) => JSON.stringify(c) !== JSON.stringify(normalized.cafes[i]));
    if (needsMigration) {
      await saveBeans(normalized.beans);
      await saveShots(normalized.shots);
      await saveCafes(normalized.cafes);
    }
    return normalized;
  }

  const initial = { beans: seedBeans, shots: seedShots, cafes: [] };
  await saveBeans(initial.beans);
  await saveShots(initial.shots);
  await saveCafes(initial.cafes);
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

export async function saveCafes(cafes: Cafe[]): Promise<void> {
  const db = await getDb();
  await db.put('cafes', cafes, JOURNAL_KEY);
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
  await db.clear('cafes');
  await db.clear('photoBlobs');
  resetDbForTests();
}

export { resetDbForTests };
