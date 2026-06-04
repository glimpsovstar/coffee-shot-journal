import type { Photo } from '../types';

export const MAX_PHOTOS_PER_ENTITY = 5;
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export type ValidateImageFilesResult =
  | { ok: true; files: File[] }
  | { ok: false; error: string };

export function validateImageFiles(
  files: FileList | File[],
  existingCount: number,
): ValidateImageFilesResult {
  const list = Array.from(files);

  if (list.length === 0) {
    return { ok: false, error: 'No files selected.' };
  }

  if (existingCount + list.length > MAX_PHOTOS_PER_ENTITY) {
    return {
      ok: false,
      error: `You can attach up to ${MAX_PHOTOS_PER_ENTITY} photos (currently ${existingCount}).`,
    };
  }

  for (const file of list) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      return {
        ok: false,
        error: `"${file.name}" is not a supported image type (JPEG, PNG, WebP, or HEIC).`,
      };
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return {
        ok: false,
        error: `"${file.name}" exceeds the 2 MB size limit.`,
      };
    }
  }

  return { ok: true, files: list };
}

export async function fileToPhoto(file: File): Promise<{ photo: Photo; blob: Blob }> {
  const buffer = await file.arrayBuffer();
  const blob = new Blob([buffer], { type: file.type });

  return {
    photo: {
      id: crypto.randomUUID(),
      fileName: file.name,
      mimeType: file.type,
      createdAt: new Date().toISOString(),
    },
    blob,
  };
}

export async function filesToPhotos(
  files: File[],
): Promise<{ photo: Photo; blob: Blob }[]> {
  return Promise.all(files.map((file) => fileToPhoto(file)));
}

export function createPhotoObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokePhotoObjectUrl(url: string): void {
  URL.revokeObjectURL(url);
}
