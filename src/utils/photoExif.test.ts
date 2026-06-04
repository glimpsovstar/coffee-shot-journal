import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractShotMetadataFromBlob, formatGpsLocation } from './photoExif';

vi.mock('exifr', () => ({
  default: {
    parse: vi.fn(),
  },
}));

import exifr from 'exifr';

const mockParse = vi.mocked(exifr.parse);

describe('formatGpsLocation', () => {
  it('formats coordinates with hemisphere labels', () => {
    expect(formatGpsLocation(-33.8688, 151.2093)).toBe('33.86880° S, 151.20930° E');
  });
});

describe('extractShotMetadataFromBlob', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns date and location when EXIF has both', async () => {
    const taken = new Date('2026-06-04T09:30:00');
    mockParse.mockResolvedValue({
      DateTimeOriginal: taken,
      latitude: -33.87,
      longitude: 151.21,
    });

    const result = await extractShotMetadataFromBlob(new Blob(['x'], { type: 'image/jpeg' }));

    expect(result.brewedAt).toEqual(taken);
    expect(result.location).toMatch(/33\.87000° S/);
    expect(result.messages.some((m) => m.includes('date and time'))).toBe(true);
    expect(result.messages.some((m) => m.includes('GPS'))).toBe(true);
  });

  it('reports missing metadata when EXIF is empty', async () => {
    mockParse.mockResolvedValue(null);

    const result = await extractShotMetadataFromBlob(new Blob(['x']));

    expect(result.brewedAt).toBeUndefined();
    expect(result.location).toBeUndefined();
    expect(result.messages[0]).toMatch(/No metadata/);
  });
});
