import { describe, expect, it } from 'vitest';
import { mockBeans, mockShot } from '../test/fixtures';
import { buildShotRecommendationContext } from './shotRecommendationContext';

describe('buildShotRecommendationContext', () => {
  it('includes bean age and weather from shot and bean', () => {
    const shot = {
      ...mockShot,
      brewedAt: '2026-06-04T10:00:00',
      weather: {
        temperatureC: 18,
        humidityPercent: 80,
        description: 'Humid',
        source: 'open-meteo' as const,
        observedAt: '2026-06-04T10:00:00.000Z',
      },
    };
    const context = buildShotRecommendationContext(shot, mockBeans[0]);

    expect(context.bean?.daysSinceRoast).toBe(33);
    expect(context.weather?.humidityPercent).toBe(80);
    expect(context.doseIn).toBe(18);
  });
});
