import type { Photo, PhotoBlobInput } from '../types';

export const MAX_PHOTOS_PER_ENTITY = 5;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const MAX_PHOTO_SIZE_LABEL = '5 MB';

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

const COMPRESSIBLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type ValidateImageFilesResult =
  | { ok: true; files: File[] }
  | { ok: false; error: string };

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  }

  return { ok: true, files: list };
}

async function compressImageFile(file: File, maxBytes: number): Promise<File | null> {
  if (!COMPRESSIBLE_TYPES.has(file.type)) return null;

  try {
    const bitmap = await createImageBitmap(file);
    let scale = 1;
    let quality = 0.88;

    while (scale >= 0.25) {
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(bitmap, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((result) => resolve(result), 'image/jpeg', quality);
      });
      if (blob && blob.size <= maxBytes) {
        const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
        return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
      }

      quality -= 0.1;
      if (quality < 0.45) {
        scale *= 0.75;
        quality = 0.88;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/** Shrink oversized JPEG/PNG/WebP before upload; HEIC must already be under the limit. */
export async function prepareImageFilesForUpload(files: File[]): Promise<ValidateImageFilesResult> {
  const prepared: File[] = [];

  for (const file of files) {
    if (file.size <= MAX_PHOTO_BYTES) {
      prepared.push(file);
      continue;
    }

    const compressed = await compressImageFile(file, MAX_PHOTO_BYTES);
    if (compressed) {
      prepared.push(compressed);
      continue;
    }

    return {
      ok: false,
      error: `"${file.name}" is ${formatFileSize(file.size)} — limit is ${MAX_PHOTO_SIZE_LABEL}. Pick a different photo or use a smaller export.`,
    };
  }

  return { ok: true, files: prepared };
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

/** Build upload inputs; keep original file bytes for EXIF when compression replaced the file. */
export async function filesToPhotoInputs(
  preparedFiles: File[],
  originalFiles: File[],
): Promise<PhotoBlobInput[]> {
  const inputs: PhotoBlobInput[] = [];

  for (let i = 0; i < preparedFiles.length; i++) {
    const file = preparedFiles[i]!;
    const original = originalFiles[i]!;
    const { photo, blob } = await fileToPhoto(file);
    let exifBlob: Blob | undefined;

    if (file !== original) {
      exifBlob = new Blob([await original.arrayBuffer()], { type: original.type });
    }

    inputs.push({ photo, blob, exifBlob });
  }

  return inputs;
}

export function metadataBlobForPhoto(input: PhotoBlobInput): Blob {
  return input.exifBlob ?? input.blob;
}

export async function filesToPhotos(
  files: File[],
): Promise<PhotoBlobInput[]> {
  return filesToPhotoInputs(files, files);
}

export function createPhotoObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokePhotoObjectUrl(url: string): void {
  URL.revokeObjectURL(url);
}
