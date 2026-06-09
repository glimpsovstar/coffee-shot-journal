import { describe, expect, it } from 'vitest';
import { parseLabelScanRequestBody } from './labelScanRequest';

describe('parseLabelScanRequestBody', () => {
  it('accepts a valid payload', () => {
    const result = parseLabelScanRequestBody({
      mimeType: 'image/jpeg',
      imageBase64: 'abc123',
    });
    expect(result).toEqual({ mimeType: 'image/jpeg', imageBase64: 'abc123' });
  });

  it('defaults mime type when missing', () => {
    const result = parseLabelScanRequestBody({ imageBase64: 'abc123' });
    expect(result).toEqual({ mimeType: 'image/jpeg', imageBase64: 'abc123' });
  });

  it('rejects missing imageBase64', () => {
    expect(parseLabelScanRequestBody({})).toMatch(/imageBase64/);
  });

  it('rejects oversized payloads', () => {
    const huge = 'a'.repeat(8 * 1024 * 1024);
    expect(parseLabelScanRequestBody({ imageBase64: huge })).toMatch(/too large/);
  });
});
