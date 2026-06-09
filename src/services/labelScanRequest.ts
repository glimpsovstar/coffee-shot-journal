/** Max decoded image size aligned with photo upload limit (5 MB). */
export const LABEL_SCAN_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Base64 expands ~4/3; allow a small overhead for padding. */
export const LABEL_SCAN_MAX_BASE64_LENGTH = Math.ceil(LABEL_SCAN_MAX_IMAGE_BYTES * (4 / 3)) + 256;

export interface LabelScanRequestBody {
  mimeType: string;
  imageBase64: string;
}

export function parseLabelScanRequestBody(body: unknown): LabelScanRequestBody | string {
  if (!body || typeof body !== 'object') {
    return 'Request body must be a JSON object.';
  }

  const record = body as Record<string, unknown>;
  const imageBase64 = record.imageBase64;
  const mimeType = record.mimeType;

  if (typeof imageBase64 !== 'string' || imageBase64.trim().length === 0) {
    return 'imageBase64 is required.';
  }

  if (imageBase64.length > LABEL_SCAN_MAX_BASE64_LENGTH) {
    return 'Image is too large (max 5 MB).';
  }

  const normalizedMime =
    typeof mimeType === 'string' && mimeType.trim().length > 0 ? mimeType : 'image/jpeg';

  return { mimeType: normalizedMime, imageBase64 };
}
