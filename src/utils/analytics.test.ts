import { describe, expect, it } from 'vitest';
import type { Shot } from '../types';
import {
  buildShotChartSeries,
  buildHomeAnalyticsSeries,
  extractionRatioValue,
  formatExtractionRatioLabel,
  formatHeroRecipeLine,
  FLOATING_HERO_PHOTO_LIMIT,
  getFeaturedShotWithPhoto,
  getRecentExtractionPhotos,
  hasContextChartData,
} from './analytics';

const baseShot: Shot = {
  id: 's1',
  beanId: 'b1',
  brewedAt: '2026-06-01T08:00:00',
  grinder: 'Niche',
  grindSetting: '14',
  doseIn: 18,
  yieldOut: 36,
  extractionTime: 28,
  tastingNotes: '',
  rating: 4,
  photos: [{ id: 'p1', fileName: 'a.jpg', mimeType: 'image/jpeg', createdAt: '2026-06-01T08:00:00' }],
};

describe('analytics', () => {
  it('computes extraction ratio', () => {
    expect(extractionRatioValue(18, 36)).toBe(2);
    expect(extractionRatioValue(0, 36)).toBeNull();
    expect(formatExtractionRatioLabel(2.3)).toBe('1:2.3');
  });

  it('picks newest shot with a photo', () => {
    const older: Shot = { ...baseShot, id: 'old', brewedAt: '2026-06-01T08:00:00', photos: [] };
    const newer: Shot = {
      ...baseShot,
      id: 'new',
      brewedAt: '2026-06-04T08:00:00',
      photos: baseShot.photos,
    };
    expect(getFeaturedShotWithPhoto([older, newer])?.id).toBe('new');
  });

  it('formats hero recipe with weather', () => {
    const shot: Shot = {
      ...baseShot,
      weather: {
        temperatureC: 8.2,
        humidityPercent: 50,
        description: 'Clear',
        source: 'open-meteo',
        observedAt: '2026-06-01T08:00:00',
      },
      extractionTime: 19,
      doseIn: 15.5,
      yieldOut: 35,
    };
    expect(formatHeroRecipeLine(shot)).toBe('15.5g in ➔ 35g out | 19s at 8.2°C');
  });

  it('collects recent extraction photos newest first up to limit', () => {
    const photo = baseShot.photos[0]!;
    const shots: Shot[] = Array.from({ length: 12 }, (_, i) => ({
      ...baseShot,
      id: `s${i}`,
      brewedAt: `2026-06-${String(i + 1).padStart(2, '0')}T08:00:00`,
      photos: [{ ...photo, id: `p${i}` }],
    }));

    const recent = getRecentExtractionPhotos(shots);
    expect(recent.length).toBe(FLOATING_HERO_PHOTO_LIMIT);
    expect(recent[0]?.shot.id).toBe('s11');
    expect(recent[9]?.shot.id).toBe('s2');
  });

  it('builds chronological chart series', () => {
    const points = buildShotChartSeries([
      { ...baseShot, id: 'a', brewedAt: '2026-06-02T08:00:00', doseIn: 18, yieldOut: 36, extractionTime: 30 },
      { ...baseShot, id: 'b', brewedAt: '2026-06-01T08:00:00', doseIn: 18, yieldOut: 40, extractionTime: 24 },
    ]);
    expect(points.map((p) => p.id)).toEqual(['b', 'a']);
    expect(points[1]?.extractionRatio).toBe(2);
    expect(points[1]?.durationSec).toBe(30);
  });

  it('builds home analytics series with bean age and humidity', () => {
    const beans = [
      {
        id: 'b1',
        name: 'Ethiopia',
        roaster: 'Test',
        kind: 'single_origin' as const,
        originOrBlend: 'Ethiopia',
        roastStyle: 'light' as const,
        blendComponents: [],
        roastDate: '2026-05-01',
        purchaseDate: '2026-05-02',
        bagSize: '250g' as const,
        tastingNotes: '',
        photos: [],
      },
    ];
    const shots: Shot[] = [
      {
        ...baseShot,
        id: 's1',
        beanId: 'b1',
        brewedAt: '2026-06-04T08:00:00',
        grindSetting: '14',
        weather: {
          temperatureC: 18,
          humidityPercent: 70,
          description: 'Humid',
          source: 'open-meteo',
          observedAt: '2026-06-04T08:00:00.000Z',
        },
      },
    ];
    const points = buildHomeAnalyticsSeries(shots, beans);
    expect(points[0]?.beanAgeDays).toBe(33);
    expect(points[0]?.humidityPercent).toBe(70);
    expect(points[0]?.grindSettingNumeric).toBe(14);
    expect(hasContextChartData(points)).toBe(true);
  });
});
