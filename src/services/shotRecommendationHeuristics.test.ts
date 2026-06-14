import { describe, expect, it } from 'vitest';
import { buildHeuristicRecommendations } from './shotRecommendationHeuristics';
import type { ShotRecommendationContext } from './shotRecommendationTypes';

describe('buildHeuristicRecommendations', () => {
  it('flags fast extraction and low ratio', () => {
    const context: ShotRecommendationContext = {
      beverageType: 'espresso',
      doseIn: 18,
      yieldOut: 27,
      extractionTime: 19,
      rating: 2,
      tastingNotes: 'Quite sour',
      brewedAt: '2026-06-04T10:00:00',
    };

    const result = buildHeuristicRecommendations(context);
    const areas = result.suggestions.map((s) => s.area);

    expect(areas).toContain('yield');
    expect(areas).toContain('time');
    expect(areas).toContain('tasting');
  });

  it('flags very fresh and stale beans', () => {
    const fresh = buildHeuristicRecommendations({
      brewedAt: '2026-05-03T10:00:00',
      bean: {
        name: 'Test',
        roaster: 'Roaster',
        roastStyle: 'medium',
        roastDate: '2026-05-01',
        purchaseDate: '2026-05-02',
        daysSinceRoast: 2,
        daysSincePurchase: 1,
      },
    });
    expect(fresh.suggestions.some((s) => s.area === 'bean_age' && s.title.includes('fresh'))).toBe(
      true,
    );

    const stale = buildHeuristicRecommendations({
      brewedAt: '2026-07-01T10:00:00',
      bean: {
        name: 'Test',
        roaster: 'Roaster',
        roastStyle: 'medium',
        roastDate: '2026-05-01',
        purchaseDate: '2026-05-02',
        daysSinceRoast: 61,
        daysSincePurchase: 60,
      },
    });
    expect(stale.suggestions.some((s) => s.priority === 'high')).toBe(true);
  });
});
