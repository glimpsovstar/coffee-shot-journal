import type { Bean, Shot } from '../types';
import {
  getPhotoBlob,
  putPhotoBlob,
  readJournalFromIndexedDb,
  saveBeans,
  saveShots,
} from '../storage/journalRepository';
import { collectPhotoIds, type JournalData } from './journalSeed';

export const JOURNAL_BACKUP_VERSION = 1;

export interface JournalBackupPhoto {
  id: string;
  mimeType: string;
  fileName: string;
  base64: string;
}

export interface JournalBackupFile {
  version: typeof JOURNAL_BACKUP_VERSION;
  exportedAt: string;
  beans: Bean[];
  shots: Shot[];
  photos: JournalBackupPhoto[];
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export async function buildJournalBackupFromIndexedDb(): Promise<JournalBackupFile> {
  const data =
    (await readJournalFromIndexedDb()) ?? {
      beans: [],
      shots: [],
    };

  const photoIds = collectPhotoIds(data.beans, data.shots);
  const photos: JournalBackupPhoto[] = [];

  for (const photoId of photoIds) {
    const blob = await getPhotoBlob(photoId);
    if (!blob) continue;

    const beanOrShotPhoto = [...data.beans, ...data.shots]
      .flatMap((row) => row.photos)
      .find((p) => p.id === photoId);

    photos.push({
      id: photoId,
      mimeType: blob.type || beanOrShotPhoto?.mimeType || 'application/octet-stream',
      fileName: beanOrShotPhoto?.fileName ?? photoId,
      base64: await blobToBase64(blob),
    });
  }

  return {
    version: JOURNAL_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    beans: data.beans,
    shots: data.shots,
    photos,
  };
}

export function parseJournalBackupFile(raw: string): JournalBackupFile {
  const parsed = JSON.parse(raw) as JournalBackupFile;
  if (parsed.version !== JOURNAL_BACKUP_VERSION) {
    throw new Error('Unsupported backup file version.');
  }
  if (!Array.isArray(parsed.beans) || !Array.isArray(parsed.shots) || !Array.isArray(parsed.photos)) {
    throw new Error('Invalid backup file format.');
  }
  return parsed;
}

export function journalDataFromBackup(backup: JournalBackupFile): JournalData {
  return { beans: backup.beans, shots: backup.shots };
}

export function photoBlobsFromBackup(backup: JournalBackupFile): Map<string, Blob> {
  const map = new Map<string, Blob>();
  for (const photo of backup.photos) {
    map.set(photo.id, base64ToBlob(photo.base64, photo.mimeType));
  }
  return map;
}

export async function restoreJournalBackupToIndexedDb(backup: JournalBackupFile): Promise<void> {
  await saveBeans(backup.beans);
  await saveShots(backup.shots);

  for (const photo of backup.photos) {
    const blob = base64ToBlob(photo.base64, photo.mimeType);
    await putPhotoBlob(photo.id, blob);
  }
}

export function downloadJournalBackupFile(backup: JournalBackupFile): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const date = backup.exportedAt.slice(0, 10);
  anchor.href = url;
  anchor.download = `coffee-shot-journal-backup-${date}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
