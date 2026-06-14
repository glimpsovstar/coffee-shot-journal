import { describe, expect, it } from 'vitest';
import { parseShotRecommendationRequestBody } from './shotRecommendationRequest';

describe('parseShotRecommendationRequestBody', () => {
  it('requires context object', () => {
    expect(parseShotRecommendationRequestBody(null)).toMatch(/JSON object/);
    expect(parseShotRecommendationRequestBody({})).toMatch(/context is required/);
  });

  it('accepts context without image', () => {
    const parsed = parseShotRecommendationRequestBody({
      context: { doseIn: 18, yieldOut: 36 },
    });
    expect(parsed).toEqual({
      context: { doseIn: 18, yieldOut: 36 },
      mimeType: undefined,
      imageBase64: undefined,
    });
  });

  it('accepts optional image fields', () => {
    const parsed = parseShotRecommendationRequestBody({
      context: { doseIn: 18 },
      mimeType: 'image/png',
      imageBase64: 'abc',
    });
    if (typeof parsed === 'string') throw new Error(parsed);
    expect(parsed.mimeType).toBe('image/png');
    expect(parsed.imageBase64).toBe('abc');
  });
});
