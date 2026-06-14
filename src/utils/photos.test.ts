import { describe, expect, it } from 'vitest';
import {
  ACCEPTED_IMAGE_TYPES,
  filesToPhotoInputs,
  formatFileSize,
  MAX_PHOTO_BYTES,
  MAX_PHOTO_SIZE_LABEL,
  MAX_PHOTOS_PER_ENTITY,
  prepareImageFilesForUpload,
  validateImageFiles,
} from './photos';

function makeFile(name: string, type: string, size: number): File {
  const buffer = new Uint8Array(size);
  return new File([buffer], name, { type });
}

describe('validateImageFiles', () => {
  it('accepts valid image files within limits', () => {
    const file = makeFile('puck.jpg', 'image/jpeg', 1024);
    const result = validateImageFiles([file], 0);

    expect(result).toEqual({ ok: true, files: [file] });
  });

  it('rejects when no files selected', () => {
    const result = validateImageFiles([], 0);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/No files/);
    }
  });

  it('rejects unsupported mime types', () => {
    const file = makeFile('notes.pdf', 'application/pdf', 100);
    const result = validateImageFiles([file], 0);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not a supported image type/);
    }
  });

  it('accepts oversized files for later compression', () => {
    const file = makeFile('huge.jpg', 'image/jpeg', MAX_PHOTO_BYTES + 1);
    const result = validateImageFiles([file], 0);
    expect(result.ok).toBe(true);
  });

  it('rejects when total would exceed max photos per entity', () => {
    const file = makeFile('a.jpg', 'image/jpeg', 100);
    const result = validateImageFiles([file], MAX_PHOTOS_PER_ENTITY);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/up to 5 photos/);
    }
  });

  it('documents accepted image types', () => {
    expect(ACCEPTED_IMAGE_TYPES).toContain('image/jpeg');
    expect(ACCEPTED_IMAGE_TYPES).toContain('image/png');
  });
});

describe('formatFileSize', () => {
  it('formats megabytes for large files', () => {
    expect(formatFileSize(MAX_PHOTO_BYTES)).toBe('5.0 MB');
  });
});

describe('filesToPhotoInputs', () => {
  it('keeps original bytes for EXIF when upload file was replaced', async () => {
    const original = makeFile('big.jpg', 'image/jpeg', 1024);
    const compressed = makeFile('big.jpg', 'image/jpeg', 512);
    const inputs = await filesToPhotoInputs([compressed], [original]);

    expect(inputs.length).toBe(1);
    expect(inputs[0]?.exifBlob).toBeDefined();
    expect(inputs[0]?.exifBlob?.size).toBe(1024);
    expect(inputs[0]?.blob.size).toBe(512);
  });

  it('omits exifBlob when original and prepared are the same file', async () => {
    const file = makeFile('small.jpg', 'image/jpeg', 1024);
    const inputs = await filesToPhotoInputs([file], [file]);

    expect(inputs[0]?.exifBlob).toBeUndefined();
  });
});

describe('prepareImageFilesForUpload', () => {
  it('rejects oversized files that cannot be compressed', async () => {
    const file = makeFile('huge.heic', 'image/heic', MAX_PHOTO_BYTES + 1);
    const result = await prepareImageFilesForUpload([file]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(MAX_PHOTO_SIZE_LABEL);
      expect(result.error).toMatch(/huge\.heic/);
    }
  });
});
