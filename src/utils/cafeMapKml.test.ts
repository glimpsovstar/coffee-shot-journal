import { describe, expect, it } from 'vitest';
import type { Cafe, Shot } from '../types';
import { buildCafeMapKml } from './cafeMapKml';

const baseCafe: Cafe = {
  id: 'cafe-1',
  name: 'Manta Ray Coffee',
  address: '12 Main St, Melbourne VIC',
  latitude: -37.81,
  longitude: 144.96,
  googlePlaceId: 'ChIJtest',
  notes: 'Great patio',
  photos: [],
};

const baseShot: Shot = {
  id: 'shot-1',
  beanId: 'bean-1',
  cafeId: 'cafe-1',
  context: 'cafe_purchased',
  beverageType: 'flat_white',
  brewedAt: '2026-06-01T10:30:00.000Z',
  grinder: '',
  grindSetting: '',
  doseIn: 0,
  yieldOut: 0,
  extractionTime: 0,
  tastingNotes: 'Chocolate & jasmine',
  rating: 4,
  priceAud: 5.5,
  wouldOrderAgain: true,
  photos: [],
};

describe('buildCafeMapKml', () => {
  it('builds one placemark per café with stable id and visit summary', () => {
    const { kml, exportedCount, skippedCount } = buildCafeMapKml(
      [baseCafe],
      [baseShot],
      new Date('2026-06-14T12:00:00.000Z'),
    );

    expect(exportedCount).toBe(1);
    expect(skippedCount).toBe(0);
    expect(kml).toContain('id="coffeesnob-cafe-cafe-1"');
    expect(kml).toContain('<name>Manta Ray Coffee</name>');
    expect(kml).toContain('<coordinates>144.96,-37.81,0</coordinates>');
    expect(kml).toContain('Chocolate &amp; jasmine');
    expect(kml).toContain('<strong>Visits logged:</strong> 1');
    expect(kml).toContain('googlePlaceId');
    expect(kml).toContain('ChIJtest');
  });

  it('skips cafés without valid coordinates', () => {
    const badCafe: Cafe = {
      ...baseCafe,
      id: 'cafe-bad',
      latitude: NaN,
      longitude: 144.96,
    };

    const { exportedCount, skippedCount } = buildCafeMapKml([badCafe, baseCafe], []);

    expect(exportedCount).toBe(1);
    expect(skippedCount).toBe(1);
  });

  it('includes older visits up to the limit', () => {
    const shots: Shot[] = [
      { ...baseShot, id: 's1', tastingNotes: 'visit-one', brewedAt: '2026-06-07T10:00:00.000Z' },
      { ...baseShot, id: 's2', tastingNotes: 'visit-two', brewedAt: '2026-06-06T10:00:00.000Z' },
      { ...baseShot, id: 's3', tastingNotes: 'visit-three', brewedAt: '2026-06-05T10:00:00.000Z' },
      { ...baseShot, id: 's4', tastingNotes: 'visit-four', brewedAt: '2026-06-04T10:00:00.000Z' },
      { ...baseShot, id: 's5', tastingNotes: 'visit-five', brewedAt: '2026-06-03T10:00:00.000Z' },
      { ...baseShot, id: 's6', tastingNotes: 'visit-six', brewedAt: '2026-06-02T10:00:00.000Z' },
      { ...baseShot, id: 's7', tastingNotes: 'visit-seven', brewedAt: '2026-06-01T10:00:00.000Z' },
    ];

    const { kml } = buildCafeMapKml([baseCafe], shots);

    expect(kml).toContain('Earlier visits');
    expect(kml).toContain('visit-six');
    expect(kml).not.toContain('visit-seven');
  });

  it('escapes XML in café names', () => {
    const cafe: Cafe = { ...baseCafe, name: 'Café <Special>' };
    const { kml } = buildCafeMapKml([cafe], []);

    expect(kml).toContain('<name>Café &lt;Special&gt;</name>');
  });
});
