import { describe, expect, it } from 'vitest';
import { getGoogleMapsOpenUrl, getGoogleMapsPlaceOpenUrl } from './mapsConfig';

describe('getGoogleMapsPlaceOpenUrl', () => {
  it('uses query_place_id when googlePlaceId is set', () => {
    const url = getGoogleMapsPlaceOpenUrl({
      latitude: -37.81,
      longitude: 144.96,
      googlePlaceId: 'ChIJabc',
    });

    expect(url).toContain('query_place_id=ChIJabc');
    expect(url).not.toContain('144.96');
  });

  it('falls back to coordinates when place id is missing', () => {
    const url = getGoogleMapsPlaceOpenUrl({ latitude: -37.81, longitude: 144.96 });
    expect(url).toBe(getGoogleMapsOpenUrl(-37.81, 144.96));
  });
});
