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

  it('maps autocomplete suggestions', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestions: [
            {
              placePrediction: {
                placeId: 'abc123',
                structuredFormat: {
                  mainText: { text: 'Market Lane Coffee' },
                  secondaryText: { text: 'Collins St, Melbourne' },
                },
              },
            },
          ],
        }),
      }),
    );

    const results = await autocompleteCafePlaces('Market');
    expect(results).toEqual([
      {
        placeId: 'abc123',
        name: 'Market Lane Coffee',
        address: 'Collins St, Melbourne',
      },
    ]);
  });
});
