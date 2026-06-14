import { LABEL_SCAN_MAX_BASE64_LENGTH } from './labelScanRequest.js';
import type { ShotRecommendationContext } from './shotRecommendationTypes.js';

export interface ShotRecommendationRequestBody {
  context: ShotRecommendationContext;
  mimeType?: string;
  imageBase64?: string;
}

export function parseShotRecommendationRequestBody(body: unknown): ShotRecommendationRequestBody | string {
  if (!body || typeof body !== 'object') {
    return 'Request body must be a JSON object.';
  }

  const record = body as Record<string, unknown>;
  const context = record.context;
  if (!context || typeof context !== 'object') {
    return 'context is required.';
  }

  const imageBase64 = record.imageBase64;
  const mimeType = record.mimeType;

  if (imageBase64 !== undefined) {
    if (typeof imageBase64 !== 'string' || imageBase64.trim().length === 0) {
      return 'imageBase64 must be a non-empty string when provided.';
    }
    if (imageBase64.length > LABEL_SCAN_MAX_BASE64_LENGTH) {
      return 'Image is too large (max 5 MB).';
    }
  }

  const normalizedMime =
    typeof mimeType === 'string' && mimeType.trim().length > 0 ? mimeType : 'image/jpeg';

  return {
    context: context as ShotRecommendationContext,
    mimeType: imageBase64 ? normalizedMime : undefined,
    imageBase64: typeof imageBase64 === 'string' ? imageBase64 : undefined,
  };
}
