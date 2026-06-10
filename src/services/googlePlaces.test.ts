import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  autocompleteCafePlaces,
  getCafePlaceDetails,
  searchCafesNearLocation,
} from './googlePlaces';

describe('googlePlaces', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('returns empty when API key is not configured', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '');
    expect(await autocompleteCafePlaces('Market Lane')).toEqual([]);
    expect(await searchCafesNearLocation(-37.81, 144.96)).toEqual([]);
    expect(await getCafePlaceDetails('place-1')).toBeNull();
  });

  it('maps autocomplete suggestions from place resource id', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [
          {
            placePrediction: {
              place: 'places/ChIJ5YQQf1GHhYARPKG7WLIaOko',
              structuredFormat: {
                mainText: { text: 'Market Lane Coffee' },
                secondaryText: { text: 'Collins St, Melbourne' },
              },
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const results = await autocompleteCafePlaces('Market');
    expect(results).toEqual([
      {
        placeId: 'ChIJ5YQQf1GHhYARPKG7WLIaOko',
        name: 'Market Lane Coffee',
        address: 'Collins St, Melbourne',
      },
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('falls back to text search when autocomplete is empty', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ suggestions: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [
            {
              id: 'places/ChIJallpress',
              displayName: { text: 'Allpress Ponsonby' },
              formattedAddress: '8 Drake St, Auckland',
              location: { latitude: -36.85, longitude: 174.75 },
            },
          ],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const results = await autocompleteCafePlaces('Allpress Ponsonby');
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe('Allpress Ponsonby');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
