import { describe, expect, it } from 'vitest';
import { buildAnalyticsTrendRecommendations } from './analyticsTrendRecommendations';
import type { HomeAnalyticsPoint } from './analytics';

function point(
  overrides: Partial<HomeAnalyticsPoint> & Pick<HomeAnalyticsPoint, 'id'>,
): HomeAnalyticsPoint {
  return {
    label: overrides.id,
    brewedAt: '2026-06-01T08:00:00',
    extractionRatio: 2,
    durationSec: 28,
    beanAgeDays: null,
    grindSetting: null,
    grindSettingNumeric: null,
    humidityPercent: null,
    ...overrides,
  };
}

describe('buildAnalyticsTrendRecommendations', () => {
  it('describes a single chart point with context', () => {
    const result = buildAnalyticsTrendRecommendations([
      point({
        id: 'a',
        beanAgeDays: 10,
        humidityPercent: 65,
        grindSetting: '14',
        grindSettingNumeric: 14,
      }),
    ]);
    expect(result.summary).toMatch(/One point/);
    expect(result.suggestions[0]?.detail).toMatch(/65% humidity/);
    expect(result.disclaimer).not.toMatch(/photo analysis/i);
  });

  it('flags rising extraction ratio trend', () => {
    const result = buildAnalyticsTrendRecommendations([
      point({ id: 'a', extractionRatio: 1.8 }),
      point({ id: 'b', extractionRatio: 2.0 }),
      point({ id: 'c', extractionRatio: 2.3 }),
    ]);
    expect(result.suggestions.some((s) => s.area === 'trend_ratio')).toBe(true);
  });

  it('flags grind changes between pulls', () => {
    const result = buildAnalyticsTrendRecommendations([
      point({ id: 'a', label: 'Jun 1', grindSetting: '14', grindSettingNumeric: 14 }),
      point({
        id: 'b',
        label: 'Jun 2',
        grindSetting: '15',
        grindSettingNumeric: 15,
        extractionRatio: 1.9,
      }),
    ]);
    expect(result.suggestions.some((s) => s.area === 'grind_change')).toBe(true);
  });

  it('flags humidity rising with longer shots', () => {
    const result = buildAnalyticsTrendRecommendations([
      point({ id: 'a', durationSec: 26, humidityPercent: 45 }),
      point({ id: 'b', durationSec: 28, humidityPercent: 52 }),
      point({ id: 'c', durationSec: 33, humidityPercent: 68 }),
    ]);
    expect(result.suggestions.some((s) => s.area === 'humidity_duration')).toBe(true);
  });

  it('flags pull time outside typical espresso window', () => {
    const result = buildAnalyticsTrendRecommendations([
      point({ id: 'a', durationSec: 20 }),
      point({ id: 'b', durationSec: 19 }),
    ]);
    expect(result.suggestions.some((s) => s.area === 'target_duration')).toBe(true);
  });

  it('reports steady trends when metrics hold', () => {
    const result = buildAnalyticsTrendRecommendations([
      point({ id: 'a' }),
      point({ id: 'b' }),
      point({ id: 'c' }),
    ]);
    expect(result.summary).toMatch(/steady/);
    expect(result.suggestions).toHaveLength(0);
  });
});
