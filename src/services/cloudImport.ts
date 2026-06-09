import { markCloudImportDone } from '../lib/cloudConfig';
import { collectPhotoIds, journalDiffersFromSeed, type JournalData } from '../utils/journalSeed';
import {
  getPhotoBlob,
  readJournalFromIndexedDb,
  type JournalData as LocalJournalData,
} from '../storage/journalRepository';
import {
  putPhotoBlobToCloud,
  saveBeansToCloud,
  saveShotsToCloud,
} from '../storage/supabaseJournalRepository';

export interface CloudImportResult {
  beans: number;
  shots: number;
  photos: number;
}

async function loadLocalJournalForImport(): Promise<LocalJournalData> {
  const raw = await readJournalFromIndexedDb();
  if (!raw) {
    return { beans: [], shots: [] };
  }
  return raw;
}

export async function importLocalJournalToCloud(userId: string): Promise<CloudImportResult> {
  const local = await loadLocalJournalForImport();
  const photoIds = collectPhotoIds(local.beans, local.shots);

  let photosUploaded = 0;
  for (const photoId of photoIds) {
    const blob = await getPhotoBlob(photoId);
    if (!blob) continue;
    await putPhotoBlobToCloud(userId, photoId, blob);
    photosUploaded += 1;
  }

  await saveBeansToCloud(userId, local.beans);
  await saveShotsToCloud(userId, local.shots);
  markCloudImportDone(userId);

  return {
    beans: local.beans.length,
    shots: local.shots.length,
    photos: photosUploaded,
  };
}

export async function hasCustomLocalJournal(): Promise<boolean> {
  const local = await loadLocalJournalForImport();
  return journalDiffersFromSeed(local);
}

/** Test helper: import explicit journal payload to cloud. */
export async function importJournalDataToCloud(
  userId: string,
  data: JournalData,
  photoBlobs: Map<string, Blob>,
): Promise<CloudImportResult> {
  const photoIds = collectPhotoIds(data.beans, data.shots);
  let photosUploaded = 0;

  for (const photoId of photoIds) {
    const blob = photoBlobs.get(photoId);
    if (!blob) continue;
    await putPhotoBlobToCloud(userId, photoId, blob);
    photosUploaded += 1;
  }

  await saveBeansToCloud(userId, data.beans);
  await saveShotsToCloud(userId, data.shots);
  markCloudImportDone(userId);

  return {
    beans: data.beans.length,
    shots: data.shots.length,
    photos: photosUploaded,
  };
}
