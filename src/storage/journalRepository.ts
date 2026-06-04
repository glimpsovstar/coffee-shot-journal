import { seedBeans, seedShots } from '../data/seed';
import type { Bean, Shot } from '../types';
import { getDb, JOURNAL_KEY, resetDbForTests } from './db';

export interface JournalData {
  beans: Bean[];
  shots: Shot[];
}

export async function loadJournal(): Promise<JournalData> {
  const db = await getDb();
  const beans = await db.get('beans', JOURNAL_KEY);
  const shots = await db.get('shots', JOURNAL_KEY);

  if (beans !== undefined && shots !== undefined) {
    return { beans, shots };
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
