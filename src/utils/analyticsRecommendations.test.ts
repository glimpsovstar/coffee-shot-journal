import { describe, expect, it } from 'vitest';
import { mockBeans } from '../test/fixtures';
import type { HomeAnalyticsPoint } from './analytics';
import {
  buildGenericAnalyticsRecommendations,
  buildPointAnalyticsRecommendations,
} from './analyticsRecommendations';

function point(
  overrides: Partial<HomeAnalyticsPoint> & Pick<HomeAnalyticsPoint, 'id'>,
): HomeAnalyticsPoint {
  return {
    label: overrides.id,
    brewedAt: '2026-06-01T08:00:00',
    extractionRatio: 2,
    durationSec: 28,
    beanId: null,
    beanAgeDays: null,
    optimalBrewAgeDays: 14,
    grindSetting: null,
    grindSettingNumeric: null,
    humidityPercent: null,
    ...overrides,
  };
}

describe('analyticsRecommendations', () => {
  it('buildGenericAnalyticsRecommendations covers charts and degassing', () => {
    const result = buildGenericAnalyticsRecommendations();
    expect(result.summary).toMatch(/guidance/i);
    expect(result.suggestions.some((s) => s.area === 'guide_degas')).toBe(true);
    expect(result.suggestions.some((s) => s.area === 'guide_grind_time')).toBe(true);
    expect(result.suggestions.some((s) => /14/.test(s.detail))).toBe(true);
  });

  it('buildPointAnalyticsRecommendations describes a specific pull date', () => {
    const result = buildPointAnalyticsRecommendations(
      point({
        id: 'Jun 4',
        label: 'Jun 4',
        beanId: 'b1',
        beanAgeDays: 4,
        grindSetting: '15',
        grindSettingNumeric: 15,
        durationSec: 22,
        extractionRatio: 2.1,
      }),
      mockBeans,
    );
    expect(result.summary).toMatch(/Jun 4/);
    expect(result.suggestions.some((s) => s.area === 'point_bean_age' && /degassing|gassy/i.test(s.detail))).toBe(true);
    expect(result.suggestions.some((s) => s.area === 'point_grind')).toBe(true);
  });

  it('buildPointAnalyticsRecommendations notes optimal window pulls', () => {
    const result = buildPointAnalyticsRecommendations(
      point({
        id: 'Jun 15',
        label: 'Jun 15',
        beanId: 'b1',
        beanAgeDays: 14,
      }),
      mockBeans,
    );
    expect(result.suggestions.some((s) => /optimal window/i.test(s.detail))).toBe(true);
  });
});
