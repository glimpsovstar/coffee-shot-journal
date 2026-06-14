import type { Bean } from '../types';
import { ANALYTICS_TREND_DISCLAIMER } from '../services/shotRecommendationTypes';
import type {
  ShotRecommendationResult,
  ShotRecommendationSuggestion,
} from '../services/shotRecommendationTypes';
import type { HomeAnalyticsPoint } from './analytics';
import { formatExtractionRatioLabel } from './analytics';
import { formatBeanChoiceLabel } from './beans';
import {
  BEAN_BREW_WINDOW_SUMMARY,
  brewWindowPhase,
  daysUntilOptimalBrew,
  formatBrewWindowPhase,
  OPTIMAL_BREW_DAYS_MAX,
  OPTIMAL_BREW_DAYS_MIN,
  OPTIMAL_BREW_DAYS_TARGET,
} from './beanBrewWindow';
import {
  durationVsTarget,
  ESPRESSO_DURATION_MAX_SEC,
  ESPRESSO_DURATION_MIN_SEC,
  ESPRESSO_DURATION_TARGET_SEC,
  ESPRESSO_RATIO_MAX,
  ESPRESSO_RATIO_MIN,
  ESPRESSO_TARGET_SUMMARY,
  formatDurationSweetSpotDelta,
  formatRatioSweetSpotDelta,
  ratioVsTarget,
} from './espressoTargets';
import { getBeanById } from './shots';
import { buildAnalyticsTrendRecommendations } from './analyticsTrendRecommendations';

export function buildGenericAnalyticsRecommendations(): ShotRecommendationResult {
  const suggestions: ShotRecommendationSuggestion[] = [
    {
      area: 'guide_extraction',
      title: 'Reading the extraction chart',
      detail: `${ESPRESSO_TARGET_SUMMARY} Solid lines are your shots; dashed lines are sweet spots (1:2 and ~${ESPRESSO_DURATION_TARGET_SEC}s); shaded bands are the typical windows. Vertical gap to a dashed line shows how far off that shot was.`,
      priority: 'low',
    },
    {
      area: 'guide_degas',
      title: 'Roast date vs optimal brew window',
      detail: `${BEAN_BREW_WINDOW_SUMMARY} The bean-age chart highlights ~${OPTIMAL_BREW_DAYS_TARGET} days off roast. Before that, trapped gas can speed up flow—finer grinds are common; after degassing you may need to grind coarser again for the same time.`,
      priority: 'low',
    },
    {
      area: 'guide_grind_time',
      title: 'Grind changes and shot time',
      detail:
        'When shot time moves, check whether grind setting changed on the same chart. A finer grind with faster time can balance gassy young beans; as the bag rests toward ~2 weeks, the same grind often slows the shot—adjust grind in small steps and taste each change.',
      priority: 'low',
    },
  ];

  return {
    summary: 'General espresso and degassing guidance for these charts.',
    suggestions,
    warnings: [],
    disclaimer: ANALYTICS_TREND_DISCLAIMER,
  };
}

export function buildPointAnalyticsRecommendations(
  point: HomeAnalyticsPoint,
  beans: Bean[],
): ShotRecommendationResult {
  const suggestions: ShotRecommendationSuggestion[] = [];
  const bean = point.beanId ? getBeanById(beans, point.beanId) : undefined;
  const beanLabel = bean ? formatBeanChoiceLabel(bean) : 'Unknown bean';

  if (point.extractionRatio !== null) {
    suggestions.push({
      area: 'point_ratio',
      title: 'Ratio on this shot',
      detail: `${formatExtractionRatioLabel(point.extractionRatio)} (${formatRatioSweetSpotDelta(point.extractionRatio)}) at ${point.label}.`,
      priority: 'low',
    });
  }

  if (point.durationSec > 0) {
    suggestions.push({
      area: 'point_time',
      title: 'Shot time on this shot',
      detail: `${point.durationSec}s (${formatDurationSweetSpotDelta(point.durationSec)}) at ${point.label}.`,
      priority: 'low',
    });
  }

  if (point.beanAgeDays !== null) {
    const phase = brewWindowPhase(point.beanAgeDays);
    const daysUntil = daysUntilOptimalBrew(point.beanAgeDays);
    let detail = `${beanLabel} was ${formatBrewWindowPhase(point.beanAgeDays)} on this date.`;
    if (phase === 'degassing') {
      detail +=
        ' Expect fast, sometimes uneven shots—finer grind and consistent prep help; flavour often settles after the bag rests closer to ~14 days off roast.';
    } else if (phase === 'approaching_optimal') {
      detail += daysUntil
        ? ` About ${daysUntil} day(s) until the ~${OPTIMAL_BREW_DAYS_TARGET}d sweet spot—watch for shot times lengthening as gas releases.`
        : ' Approaching the typical post-degas window.';
    } else if (phase === 'optimal') {
      detail += ` Within the ${OPTIMAL_BREW_DAYS_MIN}–${OPTIMAL_BREW_DAYS_MAX} day window many baristas prefer after degassing.`;
    } else {
      detail += ' Past peak window—slightly finer grind or fresher beans may help more than chasing time alone.';
    }
    suggestions.push({
      area: 'point_bean_age',
      title: 'Bean age on this shot',
      detail,
      priority: phase === 'degassing' ? 'medium' : 'low',
    });
  }

  if (point.grindSetting) {
    suggestions.push({
      area: 'point_grind',
      title: 'Grind on this shot',
      detail: `Grind setting ${point.grindSetting}. Compare with earlier/later points on the grind line—if time shifted when grind stayed the same, bean age or humidity likely moved flow.`,
      priority: 'low',
    });
  }

  if (point.humidityPercent !== null) {
    suggestions.push({
      area: 'point_humidity',
      title: 'Humidity on this shot',
      detail: `${point.humidityPercent}% humidity when logged. High humidity can slow flow; very dry air increases static—factor that in before a large grind change.`,
      priority: 'low',
    });
  }

  const ratioTarget = point.extractionRatio !== null ? ratioVsTarget(point.extractionRatio) : null;
  const durationTarget = point.durationSec > 0 ? durationVsTarget(point.durationSec) : null;
  if (ratioTarget === 'below' || ratioTarget === 'above') {
    suggestions.push({
      area: 'point_target_ratio',
      title: 'Ratio vs typical window',
      detail:
        ratioTarget === 'below'
          ? `Below the 1:${ESPRESSO_RATIO_MIN.toFixed(1)}–1:${ESPRESSO_RATIO_MAX.toFixed(1)} band—often tastes thin or sour; finer grind or longer time may help if taste agrees.`
          : `Above the typical ratio band—watch for bitterness; coarser grind or shorter yield may help.`,
      priority: 'medium',
    });
  }
  if (durationTarget === 'below' || durationTarget === 'above') {
    suggestions.push({
      area: 'point_target_duration',
      title: 'Time vs typical window',
      detail:
        durationTarget === 'below'
          ? `Faster than ${ESPRESSO_DURATION_MIN_SEC}–${ESPRESSO_DURATION_MAX_SEC}s—common with very fresh beans (gas) or too coarse a grind.`
          : `Slower than the typical window—can indicate fine grind, over-extraction, or humid conditions.`,
      priority: 'medium',
    });
  }

  return {
    summary: `Snapshot for ${point.label} (${beanLabel}).`,
    suggestions,
    warnings: [],
    disclaimer: ANALYTICS_TREND_DISCLAIMER,
  };
}

/** Re-export for convenience. */
export { buildAnalyticsTrendRecommendations };
