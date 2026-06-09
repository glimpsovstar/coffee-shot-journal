import { markCloudImportPromptHandled } from '../lib/cloudConfig';
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

export async function importLocalJournalToCloud(userId: string): Promise<CloudImportResult> {
  const local = await readLocalJournalForImport();
  if (!local) {
    throw new Error('No local journal on this device to import.');
  }

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
  markCloudImportPromptHandled(userId);

  return {
    beans: local.beans.length,
    shots: local.shots.length,
    photos: photosUploaded,
  };
}

async function readLocalJournalForImport(): Promise<LocalJournalData | null> {
  const raw = await readJournalFromIndexedDb();
  if (!raw) return null;
  return raw;
}

export async function hasCustomLocalJournal(): Promise<boolean> {
  const local = await readLocalJournalForImport();
  if (!local) return false;
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
  markCloudImportPromptHandled(userId);

  return {
    beans: data.beans.length,
    shots: data.shots.length,
    photos: photosUploaded,
  };
}
