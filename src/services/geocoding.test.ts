import { afterEach, describe, expect, it, vi } from 'vitest';
import { geocodeSuburbInput, parseLooseSuburbInput, resolveSuburbWithGeocoding } from './geocoding';

describe('parseLooseSuburbInput', () => {
  it('parses suburb and AU state', () => {
    expect(parseLooseSuburbInput('Wantirna, VIC')).toEqual({
      name: 'Wantirna',
      state: 'VIC',
      country: 'AU',
    });
  });
});

describe('geocodeSuburbInput', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns coordinates from Open-Meteo geocoding', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              name: 'Wantirna',
              latitude: -37.87,
              longitude: 145.24,
              country_code: 'AU',
              admin1: 'Victoria',
            },
          ],
        }),
      }),
    );

    const result = await geocodeSuburbInput({
      name: 'Wantirna',
      state: 'VIC',
      country: 'AU',
    });

    expect(result?.name).toBe('Wantirna');
    expect(result?.latitude).toBeCloseTo(-37.87, 1);
    expect(result?.id).toContain('geocoded');
  });
});

describe('resolveSuburbWithGeocoding', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('geocodes loose query strings', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              name: 'Wantirna',
              latitude: -37.87,
              longitude: 145.24,
              country_code: 'AU',
            },
          ],
        }),
      }),
    );

    const result = await resolveSuburbWithGeocoding('Wantirna, VIC');
    expect(result?.state).toBe('VIC');
  });
});
