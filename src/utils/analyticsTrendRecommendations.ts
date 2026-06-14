import type {
  ShotRecommendationResult,
  ShotRecommendationSuggestion,
} from '../services/shotRecommendationTypes';
import { SHOT_RECOMMENDATION_DISCLAIMER } from '../services/shotRecommendationTypes';
import type { ShotChartPoint } from './analytics';
import { formatExtractionRatioLabel } from './analytics';

const RATIO_DRIFT_THRESHOLD = 0.15;
const DURATION_DRIFT_THRESHOLD = 4;
const RATIO_STD_THRESHOLD = 0.2;
const DURATION_STD_THRESHOLD = 3;

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** Dial-in hints from chart trend data (ratio + duration over time). */
export function buildAnalyticsTrendRecommendations(
  points: ShotChartPoint[],
): ShotRecommendationResult {
  const suggestions: ShotRecommendationSuggestion[] = [];
  const warnings: string[] = [];

  if (points.length === 0) {
    return {
      summary: 'No home pulls with chart data yet.',
      suggestions: [],
      warnings,
      disclaimer: SHOT_RECOMMENDATION_DISCLAIMER,
    };
  }

  const ratioValues = points
    .map((point) => point.extractionRatio)
    .filter((value): value is number => value !== null);
  const durationValues = points
    .filter((point) => point.durationSec > 0)
    .map((point) => point.durationSec);

  if (points.length === 1) {
    const point = points[0]!;
    if (point.extractionRatio !== null) {
      suggestions.push({
        area: 'snapshot',
        title: 'Latest pull snapshot',
        detail: `Your pull charted at ${formatExtractionRatioLabel(point.extractionRatio)} over ${point.durationSec}s (${point.label}). Log a few more home pulls to see drift and consistency hints here.`,
        priority: 'low',
      });
    } else if (point.durationSec > 0) {
      suggestions.push({
        area: 'snapshot',
        title: 'Latest pull snapshot',
        detail: `Duration was ${point.durationSec}s on ${point.label}. Add dose and yield on future pulls to track extraction ratio on this chart.`,
        priority: 'low',
      });
    }

    return {
      summary: 'One point on the chart so far—snapshot below. More pulls unlock trend analysis.',
      suggestions,
      warnings,
      disclaimer: SHOT_RECOMMENDATION_DISCLAIMER,
    };
  }

  if (ratioValues.length >= 2) {
    const firstRatio = ratioValues[0]!;
    const lastRatio = ratioValues[ratioValues.length - 1]!;
    const ratioDelta = lastRatio - firstRatio;

    if (ratioDelta > RATIO_DRIFT_THRESHOLD) {
      suggestions.push({
        area: 'trend_ratio',
        title: 'Extraction ratio is climbing',
        detail: `Ratio rose from ${formatExtractionRatioLabel(firstRatio)} to ${formatExtractionRatioLabel(lastRatio)} across ${ratioValues.length} pulls. Higher yield over time often points to a coarser grind or longer shots—taste for bitterness or dryness before changing grind.`,
        priority: 'medium',
      });
    } else if (ratioDelta < -RATIO_DRIFT_THRESHOLD) {
      suggestions.push({
        area: 'trend_ratio',
        title: 'Extraction ratio is falling',
        detail: `Ratio fell from ${formatExtractionRatioLabel(firstRatio)} to ${formatExtractionRatioLabel(lastRatio)} across ${ratioValues.length} pulls. Lower yield can taste sour or thin—consider a finer grind or slightly longer pull if flavour backs that up.`,
        priority: 'medium',
      });
    }

    const ratioStd = standardDeviation(ratioValues);
    if (ratioValues.length >= 3 && ratioStd > RATIO_STD_THRESHOLD) {
      suggestions.push({
        area: 'consistency_ratio',
        title: 'Ratios vary pull to pull',
        detail: `Extraction ratios swing by about ${ratioStd.toFixed(1)} on this chart. Check dose consistency, puck prep, and whether bean or grind setting changed between sessions.`,
        priority: 'medium',
      });
    }
  }

  if (durationValues.length >= 2) {
    const firstDuration = durationValues[0]!;
    const lastDuration = durationValues[durationValues.length - 1]!;
    const durationDelta = lastDuration - firstDuration;

    if (durationDelta > DURATION_DRIFT_THRESHOLD) {
      suggestions.push({
        area: 'trend_duration',
        title: 'Shot times are lengthening',
        detail: `Duration increased from ${firstDuration}s to ${lastDuration}s. Longer times with stable dose often mean a finer grind or restricted flow—watch for over-extraction if taste turns bitter.`,
        priority: 'medium',
      });
    } else if (durationDelta < -DURATION_DRIFT_THRESHOLD) {
      suggestions.push({
        area: 'trend_duration',
        title: 'Shot times are shortening',
        detail: `Duration dropped from ${firstDuration}s to ${lastDuration}s. Faster shots can taste sour if grind got coarser or channeling opened up—compare with your tasting notes on those days.`,
        priority: 'medium',
      });
    }

    const durationStd = standardDeviation(durationValues);
    if (durationValues.length >= 3 && durationStd > DURATION_STD_THRESHOLD) {
      suggestions.push({
        area: 'consistency_duration',
        title: 'Durations are inconsistent',
        detail: `Shot times vary by about ${durationStd.toFixed(0)}s across pulls. Inconsistent timing often traces to distribution, tamping, or grinder retention rather than a single grind tweak.`,
        priority: 'medium',
      });
    }
  }

  if (ratioValues.length >= 3) {
    const recent = ratioValues.slice(-3);
    const latest = recent[recent.length - 1]!;
    const recentAvg = average(recent);
    if (latest - recentAvg > RATIO_DRIFT_THRESHOLD) {
      suggestions.push({
        area: 'recent_ratio',
        title: 'Latest pull is higher than recent average',
        detail: `Your most recent ratio (${formatExtractionRatioLabel(latest)}) sits above the last-three average (${formatExtractionRatioLabel(recentAvg)}). If the cup tasted heavy or bitter, try matching your earlier recipe.`,
        priority: 'low',
      });
    } else if (recentAvg - latest > RATIO_DRIFT_THRESHOLD) {
      suggestions.push({
        area: 'recent_ratio',
        title: 'Latest pull is lower than recent average',
        detail: `Your most recent ratio (${formatExtractionRatioLabel(latest)}) is below the last-three average (${formatExtractionRatioLabel(recentAvg)}). If it tasted thin or sharp, a small grind adjustment may help.`,
        priority: 'low',
      });
    }
  }

  const summary =
    suggestions.length > 0
      ? `Found ${suggestions.length} pattern(s) in ratio and duration trends from the chart above.`
      : 'Ratio and duration look steady across your logged pulls—no strong drift or inconsistency in the chart data.';

  return {
    summary,
    suggestions,
    warnings,
    disclaimer: SHOT_RECOMMENDATION_DISCLAIMER,
  };
}
