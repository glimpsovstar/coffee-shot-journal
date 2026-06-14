import { describe, expect, it } from 'vitest';
import { mockBeans } from '../test/fixtures';
import type { Shot } from '../types';
import { buildHomeAnalyticsSeries } from './analytics';
import { buildAnalyticsInsightCards } from './analyticsInsightSummary';

const chartableShot: Shot = {
  id: 's1',
  beanId: 'bean-a',
  context: 'home_pulled',
  brewedAt: '2026-06-01T08:00:00',
  grinder: 'Niche',
  grindSetting: '14',
  doseIn: 18,
  yieldOut: 36,
  extractionTime: 28,
  tastingNotes: '',
  rating: 4,
  photos: [],
};

describe('buildAnalyticsInsightCards', () => {
  it('returns ratio, time, and insight cards for home series', () => {
    const homeSeries = buildHomeAnalyticsSeries([chartableShot], mockBeans);
    const cards = buildAnalyticsInsightCards(homeSeries);

    expect(cards.length).toBe(3);
    expect(cards[0]?.label).toBe('Latest ratio');
    expect(cards[0]?.value).toMatch(/1:2/);
    expect(cards[1]?.label).toBe('Latest time');
    expect(cards[1]?.value).toBe('28s');
    expect(cards[2]?.label).toBe('Insight');
  });

  it('returns empty array without home series data', () => {
    expect(buildAnalyticsInsightCards([])).toEqual([]);
  });
});
