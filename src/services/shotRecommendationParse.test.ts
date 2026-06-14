import { describe, expect, it } from 'vitest';
import {
  mergeRecommendationResults,
  parseShotRecommendationContent,
} from './shotRecommendationParse';
import { SHOT_RECOMMENDATION_DISCLAIMER } from './shotRecommendationTypes';

describe('parseShotRecommendationContent', () => {
  it('parses vision JSON into suggestions', () => {
    const result = parseShotRecommendationContent(
      JSON.stringify({
        summary: 'Crema looks thin.',
        suggestions: [
          {
            area: 'visual',
            title: 'Light crema',
            detail: 'Try a finer grind.',
            priority: 'medium',
          },
        ],
        warnings: ['Photo is blurry.'],
      }),
    );

    expect(result.summary).toBe('Crema looks thin.');
    expect(result.suggestions).toHaveLength(1);
    expect(result.warnings).toEqual(['Photo is blurry.']);
    expect(result.disclaimer).toBe(SHOT_RECOMMENDATION_DISCLAIMER);
  });
});

describe('mergeRecommendationResults', () => {
  it('dedupes suggestions by area and title', () => {
    const base = {
      summary: 'Heuristic',
      suggestions: [
        {
          area: 'time',
          title: 'Fast extraction',
          detail: 'Grind finer.',
          priority: 'medium' as const,
        },
      ],
      warnings: [],
      disclaimer: SHOT_RECOMMENDATION_DISCLAIMER,
    };
    const extra = {
      summary: 'Visual',
      suggestions: [
        {
          area: 'time',
          title: 'Fast extraction',
          detail: 'Duplicate.',
          priority: 'low' as const,
        },
        {
          area: 'visual',
          title: 'Thin crema',
          detail: 'Grind finer slightly.',
          priority: 'high' as const,
        },
      ],
      warnings: ['Note'],
      disclaimer: SHOT_RECOMMENDATION_DISCLAIMER,
    };

    const merged = mergeRecommendationResults(base, extra);
    expect(merged.suggestions).toHaveLength(2);
    expect(merged.suggestions[0]?.area).toBe('visual');
  });
});
