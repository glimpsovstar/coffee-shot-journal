import { describe, expect, it } from 'vitest';
import { buildAnalyticsTrendRecommendations } from './analyticsTrendRecommendations';
import type { ShotChartPoint } from './analytics';

function point(
  id: string,
  ratio: number | null,
  durationSec: number,
  label = id,
): ShotChartPoint {
  return {
    id,
    label,
    brewedAt: '2026-06-01T08:00:00',
    extractionRatio: ratio,
    durationSec,
  };
}

describe('buildAnalyticsTrendRecommendations', () => {
  it('describes a single chart point', () => {
    const result = buildAnalyticsTrendRecommendations([point('a', 2, 28)]);
    expect(result.summary).toMatch(/One point/);
    expect(result.suggestions[0]?.title).toMatch(/snapshot/i);
  });

  it('flags rising extraction ratio trend', () => {
    const result = buildAnalyticsTrendRecommendations([
      point('a', 1.8, 28),
      point('b', 2.0, 29),
      point('c', 2.3, 30),
    ]);
    expect(result.suggestions.some((s) => s.area === 'trend_ratio')).toBe(true);
  });

  it('flags inconsistent durations', () => {
    const result = buildAnalyticsTrendRecommendations([
      point('a', 2, 22),
      point('b', 2, 35),
      point('c', 2, 24),
      point('d', 2, 33),
    ]);
    expect(result.suggestions.some((s) => s.area === 'consistency_duration')).toBe(true);
  });

  it('reports steady trends when metrics hold', () => {
    const result = buildAnalyticsTrendRecommendations([
      point('a', 2.0, 28),
      point('b', 2.0, 29),
      point('c', 2.0, 28),
    ]);
    expect(result.summary).toMatch(/steady/);
    expect(result.suggestions).toHaveLength(0);
  });
});
