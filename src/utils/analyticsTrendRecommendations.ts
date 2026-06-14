import { ANALYTICS_TREND_DISCLAIMER } from '../services/shotRecommendationTypes';
import type {
  ShotRecommendationResult,
  ShotRecommendationSuggestion,
} from '../services/shotRecommendationTypes';
import {
  OPTIMAL_BREW_DAYS_MAX,
  OPTIMAL_BREW_DAYS_MIN,
  OPTIMAL_BREW_DAYS_TARGET,
} from './beanBrewWindow.js';
import type { HomeAnalyticsPoint } from './analytics';
import { formatExtractionRatioLabel } from './analytics';
import {
  ESPRESSO_DURATION_MAX_SEC,
  ESPRESSO_DURATION_MIN_SEC,
  ESPRESSO_DURATION_TARGET_SEC,
  ESPRESSO_RATIO_MAX,
  ESPRESSO_RATIO_MIN,
  durationVsTarget,
  ratioVsTarget,
} from './espressoTargets';

const RATIO_DRIFT_THRESHOLD = 0.15;
const DURATION_DRIFT_THRESHOLD = 4;
const RATIO_STD_THRESHOLD = 0.2;
const DURATION_STD_THRESHOLD = 3;
const HUMIDITY_DRIFT_THRESHOLD = 12;
const GRIND_CHANGE_THRESHOLD = 0.3;

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function buildContextSuggestions(points: HomeAnalyticsPoint[]): ShotRecommendationSuggestion[] {
  const suggestions: ShotRecommendationSuggestion[] = [];

  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1]!;
    const curr = points[index]!;
    const grindChanged =
      (prev.grindSettingNumeric !== null &&
        curr.grindSettingNumeric !== null &&
        Math.abs(curr.grindSettingNumeric - prev.grindSettingNumeric) >= GRIND_CHANGE_THRESHOLD) ||
      (prev.grindSetting &&
        curr.grindSetting &&
        prev.grindSetting !== curr.grindSetting &&
        (prev.grindSettingNumeric === null || curr.grindSettingNumeric === null));

    if (!grindChanged) continue;

    const grindLabel =
      prev.grindSettingNumeric !== null && curr.grindSettingNumeric !== null
        ? `${prev.grindSettingNumeric} → ${curr.grindSettingNumeric}`
        : `${prev.grindSetting ?? '?'} → ${curr.grindSetting ?? '?'}`;

    let detail = `Grind setting changed (${grindLabel}) between ${prev.label} and ${curr.label}.`;
    if (
      prev.extractionRatio !== null &&
      curr.extractionRatio !== null &&
      Math.abs(curr.extractionRatio - prev.extractionRatio) > 0.1
    ) {
      detail += ` Ratio moved from ${formatExtractionRatioLabel(prev.extractionRatio)} to ${formatExtractionRatioLabel(curr.extractionRatio)}—compare taste on those two shots before chasing other variables.`;
    } else if (Math.abs(curr.durationSec - prev.durationSec) >= 3) {
      detail += ` Shot time shifted from ${prev.durationSec}s to ${curr.durationSec}s—note whether the grind change was intentional.`;
    } else {
      detail += ' Track whether the next shots settle after this grind change.';
    }

    suggestions.push({
      area: 'grind_change',
      title: 'Grind setting changed',
      detail,
      priority: 'medium',
    });
  }

  const beanAges = points
    .map((point) => point.beanAgeDays)
    .filter((value): value is number => value !== null);
  const ratioValues = points
    .map((point) => point.extractionRatio)
    .filter((value): value is number => value !== null);

  if (beanAges.length >= 2 && ratioValues.length >= 2) {
    const ageDelta = beanAges[beanAges.length - 1]! - beanAges[0]!;
    const ratioDelta = ratioValues[ratioValues.length - 1]! - ratioValues[0]!;
    if (ageDelta >= 14 && ratioDelta < -RATIO_DRIFT_THRESHOLD) {
      suggestions.push({
        area: 'bean_age_trend',
        title: 'Beans aged as ratio fell',
        detail: `Bean age rose about ${ageDelta} days while extraction ratio trended down (${formatExtractionRatioLabel(ratioValues[0]!)} → ${formatExtractionRatioLabel(ratioValues[ratioValues.length - 1]!)}). Older coffee often needs a finer grind—staleness can taste flat or dry before bitterness shows.`,
        priority: 'medium',
      });
    }
    const latestAge = beanAges[beanAges.length - 1]!;
    if (latestAge < 4 && standardDeviation(ratioValues) > RATIO_STD_THRESHOLD) {
      suggestions.push({
        area: 'bean_age_fresh',
        title: 'Very fresh beans with variable shots',
        detail: `Latest shots are only ${latestAge} day(s) off roast with inconsistent ratios on the chart. Fresh coffee can be gassy—expect dial-in swings until the bag rests a few more days.`,
        priority: 'low',
      });
    }
    if (latestAge > 40) {
      suggestions.push({
        area: 'bean_age_stale',
        title: 'Older roast on latest shots',
        detail: `Your most recent charted shot used beans about ${latestAge} days off roast. If flavour is muted, a slightly finer grind or fresher bag may help more than chasing time alone.`,
        priority: 'medium',
      });
    }
  }

  const humidityValues = points
    .map((point) => point.humidityPercent)
    .filter((value): value is number => value !== null);
  const durationValues = points
    .filter((point) => point.durationSec > 0)
    .map((point) => point.durationSec);

  const agedPoints = points.filter((point) => point.beanAgeDays !== null);
  if (agedPoints.length >= 2) {
    const first = agedPoints[0]!;
    const last = agedPoints[agedPoints.length - 1]!;
    const ageDelta = last.beanAgeDays! - first.beanAgeDays!;
    const firstDuration = first.durationSec;
    const lastDuration = last.durationSec;
    const durationDelta = lastDuration - firstDuration;

    if (
      ageDelta >= 5 &&
      durationDelta < -4 &&
      first.beanAgeDays! < OPTIMAL_BREW_DAYS_MIN
    ) {
      suggestions.push({
        area: 'degassing_time',
        title: 'Faster shots as beans aged in the bag',
        detail: `From ${first.label} to ${last.label}, bean age rose ${ageDelta} days while shot time dropped about ${Math.abs(durationDelta)}s. CO₂ release often speeds up flow on young coffee—you may have ground finer to compensate; near ~${OPTIMAL_BREW_DAYS_TARGET} days off roast, try small coarser steps as gas leaves.`,
        priority: 'medium',
      });
    }

    if (
      ageDelta >= 5 &&
      durationDelta > 4 &&
      last.beanAgeDays! >= OPTIMAL_BREW_DAYS_MIN &&
      last.beanAgeDays! <= OPTIMAL_BREW_DAYS_MAX
    ) {
      suggestions.push({
        area: 'degassing_slowing',
        title: 'Slower shots entering optimal window',
        detail: `Shot times lengthened as beans moved into the ${OPTIMAL_BREW_DAYS_MIN}–${OPTIMAL_BREW_DAYS_MAX} day window—normal as degassing finishes. Match grind to taste rather than chasing your very first shots on this bag.`,
        priority: 'low',
      });
    }

    const grindPoints = agedPoints.filter((point) => point.grindSettingNumeric !== null);
    if (grindPoints.length >= 2) {
      const grindDelta =
        grindPoints[grindPoints.length - 1]!.grindSettingNumeric! -
        grindPoints[0]!.grindSettingNumeric!;
      if (Math.abs(grindDelta) >= GRIND_CHANGE_THRESHOLD && Math.abs(durationDelta) >= 3) {
        suggestions.push({
          area: 'grind_time_linked',
          title: 'Grind moves tracked with shot time',
          detail: `Grind shifted about ${grindDelta > 0 ? '+' : ''}${grindDelta.toFixed(1)} while shot time changed ${durationDelta}s over the same period. When dialing for degassing, change grind in small steps and log taste—time alone does not tell you if extraction improved.`,
          priority: 'medium',
        });
      }
    }
  }

  if (humidityValues.length >= 2 && durationValues.length >= 2) {
    const humidityDelta = humidityValues[humidityValues.length - 1]! - humidityValues[0]!;
    const durationDelta = durationValues[durationValues.length - 1]! - durationValues[0]!;

    if (humidityDelta > HUMIDITY_DRIFT_THRESHOLD && durationDelta > DURATION_DRIFT_THRESHOLD) {
      suggestions.push({
        area: 'humidity_duration',
        title: 'Humidity rose with longer shots',
        detail: `Humidity climbed about ${humidityDelta}% while shot times lengthened across the chart. Moist air can slow flow—consider a slightly coarser grind or better chute cleaning on humid days.`,
        priority: 'medium',
      });
    }

    const avgHumidity = average(humidityValues);
    if (avgHumidity > 75 && standardDeviation(durationValues) > DURATION_STD_THRESHOLD) {
      suggestions.push({
        area: 'humidity_variance',
        title: 'Humid sessions with inconsistent times',
        detail: `Logged humidity averaged ${avgHumidity.toFixed(0)}% with variable shot durations. High humidity often makes grounds clump—wipe the grinder chute and expect to grind slightly coarser than on dry days.`,
        priority: 'low',
      });
    }

    const lowHumidity = humidityValues.filter((value) => value < 30);
    if (lowHumidity.length >= 2 && standardDeviation(durationValues) > DURATION_STD_THRESHOLD) {
      suggestions.push({
        area: 'humidity_dry',
        title: 'Dry air with inconsistent times',
        detail: 'Several shots were logged below 30% humidity with varying shot times. Very dry air increases static and retention—consistent dosing helps more than large grind moves.',
        priority: 'low',
      });
    }
  }

  return suggestions;
}

function buildTargetSuggestions(points: HomeAnalyticsPoint[]): ShotRecommendationSuggestion[] {
  const latest = points[points.length - 1]!;
  const suggestions: ShotRecommendationSuggestion[] = [];

  if (latest.durationSec > 0) {
    const durationTarget = durationVsTarget(latest.durationSec);
    if (durationTarget === 'below') {
      suggestions.push({
        area: 'target_duration',
        title: 'Shot time below typical window',
        detail: `${latest.durationSec}s is under the ${ESPRESSO_DURATION_MIN_SEC}–${ESPRESSO_DURATION_MAX_SEC}s guide on the chart (sweet spot ~${ESPRESSO_DURATION_TARGET_SEC}s). Fast shots often taste sour—try a finer grind or slightly higher dose.`,
        priority: 'medium',
      });
    } else if (durationTarget === 'above') {
      suggestions.push({
        area: 'target_duration',
        title: 'Shot time above typical window',
        detail: `${latest.durationSec}s exceeds the ${ESPRESSO_DURATION_MIN_SEC}–${ESPRESSO_DURATION_MAX_SEC}s guide (sweet spot ~${ESPRESSO_DURATION_TARGET_SEC}s). Slow shots can taste bitter—consider a coarser grind or stopping earlier.`,
        priority: 'medium',
      });
    }
  }

  if (latest.extractionRatio !== null) {
    const ratioTarget = ratioVsTarget(latest.extractionRatio);
    if (ratioTarget === 'below') {
      suggestions.push({
        area: 'target_ratio',
        title: 'Ratio below typical window',
        detail: `${formatExtractionRatioLabel(latest.extractionRatio)} is under the 1:${ESPRESSO_RATIO_MIN.toFixed(1)}–1:${ESPRESSO_RATIO_MAX.toFixed(1)} guide (sweet spot 1:2). Low yield often tastes thin or sour.`,
        priority: 'medium',
      });
    } else if (ratioTarget === 'above') {
      suggestions.push({
        area: 'target_ratio',
        title: 'Ratio above typical window',
        detail: `${formatExtractionRatioLabel(latest.extractionRatio)} is above the 1:${ESPRESSO_RATIO_MIN.toFixed(1)}–1:${ESPRESSO_RATIO_MAX.toFixed(1)} guide (sweet spot 1:2). High yield can taste bitter or hollow.`,
        priority: 'medium',
      });
    }
  }

  return suggestions;
}

/** Dial-in hints from chart trends (ratio, duration, bean age, grind, humidity). */
export function buildAnalyticsTrendRecommendations(
  points: HomeAnalyticsPoint[],
): ShotRecommendationResult {
  const suggestions: ShotRecommendationSuggestion[] = [];
  const warnings: string[] = [];

  if (points.length === 0) {
    return {
      summary: 'No home shots with chart data yet.',
      suggestions: [],
      warnings,
      disclaimer: ANALYTICS_TREND_DISCLAIMER,
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
      const contextParts: string[] = [];
      if (point.beanAgeDays !== null) contextParts.push(`${point.beanAgeDays}d off roast`);
      if (point.humidityPercent !== null) contextParts.push(`${point.humidityPercent}% humidity`);
      if (point.grindSetting) contextParts.push(`grind ${point.grindSetting}`);
      const contextSuffix =
        contextParts.length > 0 ? ` Context: ${contextParts.join(', ')}.` : '';

      suggestions.push({
        area: 'snapshot',
        title: 'Latest shot snapshot',
        detail: `Your shot charted at ${formatExtractionRatioLabel(point.extractionRatio)} over ${point.durationSec}s (${point.label}).${contextSuffix} Log more home shots to see drift and consistency hints here.`,
        priority: 'low',
      });
    } else if (point.durationSec > 0) {
      suggestions.push({
        area: 'snapshot',
        title: 'Latest shot snapshot',
        detail: `Duration was ${point.durationSec}s on ${point.label}. Add dose and yield on future shots to track extraction ratio on this chart.`,
        priority: 'low',
      });
    }

    return {
      summary: 'One point on the chart so far—snapshot below. More shots unlock trend analysis.',
      suggestions,
      warnings,
      disclaimer: ANALYTICS_TREND_DISCLAIMER,
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
        detail: `Ratio rose from ${formatExtractionRatioLabel(firstRatio)} to ${formatExtractionRatioLabel(lastRatio)} across ${ratioValues.length} shots. Higher yield over time often points to a coarser grind or longer shots—taste for bitterness or dryness before changing grind.`,
        priority: 'medium',
      });
    } else if (ratioDelta < -RATIO_DRIFT_THRESHOLD) {
      suggestions.push({
        area: 'trend_ratio',
        title: 'Extraction ratio is falling',
        detail: `Ratio fell from ${formatExtractionRatioLabel(firstRatio)} to ${formatExtractionRatioLabel(lastRatio)} across ${ratioValues.length} shots. Lower yield can taste sour or thin—consider a finer grind or slightly longer shot if flavour backs that up.`,
        priority: 'medium',
      });
    }

    const ratioStd = standardDeviation(ratioValues);
    if (ratioValues.length >= 3 && ratioStd > RATIO_STD_THRESHOLD) {
      suggestions.push({
        area: 'consistency_ratio',
        title: 'Ratios vary shot to shot',
        detail: `Extraction ratios swing by about ${ratioStd.toFixed(1)} on this chart. Check dose consistency, puck prep, and whether bean, grind, or humidity changed between sessions.`,
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
        detail: `Shot times vary by about ${durationStd.toFixed(0)}s across shots. Inconsistent timing often traces to distribution, tamping, grinder retention, or humid/dry weather rather than a single grind tweak.`,
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
        title: 'Latest shot is higher than recent average',
        detail: `Your most recent ratio (${formatExtractionRatioLabel(latest)}) sits above the last-three average (${formatExtractionRatioLabel(recentAvg)}). If the cup tasted heavy or bitter, try matching your earlier recipe.`,
        priority: 'low',
      });
    } else if (recentAvg - latest > RATIO_DRIFT_THRESHOLD) {
      suggestions.push({
        area: 'recent_ratio',
        title: 'Latest shot is lower than recent average',
        detail: `Your most recent ratio (${formatExtractionRatioLabel(latest)}) is below the last-three average (${formatExtractionRatioLabel(recentAvg)}). If it tasted thin or sharp, a small grind adjustment may help.`,
        priority: 'low',
      });
    }
  }

  suggestions.push(...buildTargetSuggestions(points));
  suggestions.push(...buildContextSuggestions(points));

  const summary =
    suggestions.length > 0
      ? `Found ${suggestions.length} pattern(s) in extraction, bean age, grind, and weather trends from the charts above.`
      : 'Extraction, bean age, grind, and humidity look steady across your logged shots—no strong drift or inconsistency in the chart data.';

  return {
    summary,
    suggestions,
    warnings,
    disclaimer: ANALYTICS_TREND_DISCLAIMER,
  };
}
