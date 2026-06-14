import type { HomeAnalyticsPoint } from './analytics';
import { formatExtractionRatioLabel } from './analytics';
import { buildAnalyticsTrendRecommendations } from './analyticsTrendRecommendations';
import {
  formatDurationSweetSpotDelta,
  formatRatioSweetSpotDelta,
} from './espressoTargets';

export interface AnalyticsInsightCard {
  label: string;
  value: string;
  detail?: string;
}

export function buildAnalyticsInsightCards(
  homeSeries: HomeAnalyticsPoint[],
): AnalyticsInsightCard[] {
  if (homeSeries.length === 0) return [];

  const latest = homeSeries[homeSeries.length - 1]!;
  const cards: AnalyticsInsightCard[] = [];

  if (latest.extractionRatio !== null) {
    cards.push({
      label: 'Latest ratio',
      value: formatExtractionRatioLabel(latest.extractionRatio),
      detail: formatRatioSweetSpotDelta(latest.extractionRatio),
    });
  }

  if (latest.durationSec > 0) {
    cards.push({
      label: 'Latest time',
      value: `${latest.durationSec}s`,
      detail: formatDurationSweetSpotDelta(latest.durationSec),
    });
  }

  const trend = buildAnalyticsTrendRecommendations(homeSeries);
  const topSuggestion =
    trend.suggestions.find((s) => s.priority === 'high') ?? trend.suggestions[0];

  cards.push({
    label: 'Insight',
    value: topSuggestion?.title ?? 'Keep logging',
    detail: topSuggestion?.detail ?? trend.summary,
  });

  return cards.slice(0, 3);
}
