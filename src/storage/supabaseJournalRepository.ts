import { getSupabaseClient } from '../lib/supabaseClient';
import type { Bean, Cafe, Shot } from '../types';
import type { JournalData } from '../utils/journalSeed';

const PHOTO_BUCKET = 'journal-photos';

function photoPath(userId: string, photoId: string): string {
  return `${userId}/${photoId}`;
}

function parseBean(document: unknown): Bean {
  return document as Bean;
}

function parseShot(document: unknown): Shot {
  return document as Shot;
}

function parseCafe(document: unknown): Cafe {
  return document as Cafe;
}

/** Supabase project missing `public.cafes` (migration 002 not applied). */
export function isCafesTableMissingError(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? '';
  return (
    message.includes('cafes') &&
    (message.includes('does not exist') ||
      message.includes('could not find the table') ||
      message.includes('schema cache') ||
      error.code === 'PGRST205')
  );
}

export async function loadJournalFromCloud(userId: string): Promise<JournalData> {
  const supabase = getSupabaseClient();

  const beansResult = await supabase.from('beans').select('document').eq('user_id', userId);
  if (beansResult.error) throw beansResult.error;

  const shotsResult = await supabase.from('shots').select('document').eq('user_id', userId);
  if (shotsResult.error) throw shotsResult.error;

  const cafesResult = await supabase.from('cafes').select('document').eq('user_id', userId);
  let cafes: Cafe[] = [];
  if (cafesResult.error) {
    if (!isCafesTableMissingError(cafesResult.error)) {
      throw cafesResult.error;
    }
  } else {
    cafes = (cafesResult.data ?? []).map((row) => parseCafe(row.document));
  }

  return {
    beans: (beansResult.data ?? []).map((row) => parseBean(row.document)),
    shots: (shotsResult.data ?? []).map((row) => parseShot(row.document)),
    cafes,
  };
}

async function syncRows(
  table: 'beans' | 'shots' | 'cafes',
  userId: string,
  rows: { id: string; document: Bean | Shot | Cafe }[],
): Promise<void> {
  const supabase = getSupabaseClient();

  if (rows.length > 0) {
    const { error: upsertError } = await supabase.from(table).upsert(
      rows.map((row) => ({
        id: row.id,
        user_id: userId,
        document: row.document,
        updated_at: new Date().toISOString(),
      })),
    );
    if (upsertError) throw upsertError;
  }

  const { data: existing, error: selectError } = await supabase
    .from(table)
    .select('id')
    .eq('user_id', userId);
  if (selectError) throw selectError;

  const keepIds = new Set(rows.map((r) => r.id));
  const deleteIds = (existing ?? []).map((r) => r.id).filter((id) => !keepIds.has(id));

  if (deleteIds.length > 0) {
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq('user_id', userId)
      .in('id', deleteIds);
    if (deleteError) throw deleteError;
  }
}

export async function saveBeansToCloud(userId: string, beans: Bean[]): Promise<void> {
  await syncRows(
    'beans',
    userId,
    beans.map((bean) => ({ id: bean.id, document: bean })),
  );
}

export async function saveShotsToCloud(userId: string, shots: Shot[]): Promise<void> {
  await syncRows(
    'shots',
    userId,
    shots.map((shot) => ({ id: shot.id, document: shot })),
  );
}

export async function saveCafesToCloud(userId: string, cafes: Cafe[]): Promise<void> {
  await syncRows(
    'cafes',
    userId,
    cafes.map((cafe) => ({ id: cafe.id, document: cafe })),
  );
}

export async function putPhotoBlobToCloud(
  userId: string,
  photoId: string,
  blob: Blob,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(photoPath(userId, photoId), blob, {
      upsert: true,
      contentType: blob.type || 'application/octet-stream',
    });
  if (error) throw error;
}

export async function getPhotoBlobFromCloud(
  userId: string,
  photoId: string,
): Promise<Blob | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .download(photoPath(userId, photoId));
  if (error || !data) return undefined;
  return data;
}

export async function deletePhotoBlobFromCloud(userId: string, photoId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([photoPath(userId, photoId)]);
  if (error) throw error;
}
