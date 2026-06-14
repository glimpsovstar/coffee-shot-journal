import type { Bean, Photo, Shot } from '../types';
import { OPTIMAL_BREW_DAYS_TARGET } from './beanBrewWindow';
import { formatBrewedAt, getBeanById, hasShotRecipe, isHomeShot, sortShotsNewestFirst } from './shots';

/** Max extraction photos in the floating hero gallery (newest first). */
export const FLOATING_HERO_PHOTO_LIMIT = 10;

export interface RecentExtractionPhoto {
  shot: Shot;
  photo: Photo;
}

export interface ShotChartPoint {
  id: string;
  label: string;
  brewedAt: string;
  extractionRatio: number | null;
  durationSec: number;
}

/** Home pull chart point with bean age, grind, and weather context. */
export interface HomeAnalyticsPoint extends ShotChartPoint {
  beanId: string | null;
  /** Days off roast when bean is known; null for unknown / missing bean. */
  beanAgeDays: number | null;
  optimalBrewAgeDays: number;
  grindSetting: string | null;
  grindSettingNumeric: number | null;
  humidityPercent: number | null;
}

export type HomeAnalyticsChartPoint = HomeAnalyticsPoint & Record<string, number | null | string | undefined>;

function daysSinceRoast(roastDate: string, brewedAt: string): number | null {
  const roast = new Date(roastDate + 'T12:00:00');
  const brewed = new Date(brewedAt);
  if (Number.isNaN(roast.getTime()) || Number.isNaN(brewed.getTime())) return null;
  return Math.floor((brewed.getTime() - roast.getTime()) / 86400000);
}

export function parseGrindSettingNumeric(setting: string): number | null {
  const trimmed = setting.trim();
  if (!trimmed) return null;
  const value = parseFloat(trimmed);
  return Number.isNaN(value) ? null : value;
}

export function extractionRatioValue(doseIn: number, yieldOut: number): number | null {
  if (doseIn <= 0 || yieldOut <= 0) return null;
  return yieldOut / doseIn;
}

export function formatExtractionRatioLabel(ratio: number): string {
  return `1:${ratio.toFixed(1)}`;
}

/** Newest shot that has at least one photo attached. */
export function getFeaturedShotWithPhoto(shots: Shot[]): Shot | null {
  const sorted = sortShotsNewestFirst(shots);
  return sorted.find((shot) => shot.photos.length > 0) ?? null;
}

/** Recent extraction photos across shots, newest pulls first (up to `limit`). */
export function getRecentExtractionPhotos(
  shots: Shot[],
  limit = FLOATING_HERO_PHOTO_LIMIT,
): RecentExtractionPhoto[] {
  const sorted = sortShotsNewestFirst(shots);
  const results: RecentExtractionPhoto[] = [];

  for (const shot of sorted) {
    for (const photo of shot.photos) {
      if (results.length >= limit) return results;
      results.push({ shot, photo });
    }
  }

  return results;
}

/** One-line recipe for hero overlay (dose, yield, time, optional weather temp). */
export function formatHeroRecipeLine(shot: Shot): string | null {
  if (!hasShotRecipe(shot) && !shot.weather) return null;

  if (hasShotRecipe(shot)) {
    let line = `${shot.doseIn}g in ➔ ${shot.yieldOut}g out`;
    if (shot.extractionTime > 0) {
      line += shot.weather
        ? ` | ${shot.extractionTime}s at ${shot.weather.temperatureC.toFixed(1)}°C`
        : ` | ${shot.extractionTime}s`;
    }
    return line;
  }

  if (shot.weather) {
    return `${shot.weather.temperatureC.toFixed(1)}°C`;
  }

  return null;
}

/** Chronological points for the analytics chart (oldest → newest). */
export function buildShotChartSeries(shots: Shot[]): ShotChartPoint[] {
  const chronological = [...shots].sort(
    (a, b) => new Date(a.brewedAt).getTime() - new Date(b.brewedAt).getTime(),
  );

  return chronological
    .map((shot) => ({
      id: shot.id,
      label: formatBrewedAt(shot.brewedAt),
      brewedAt: shot.brewedAt,
      extractionRatio: extractionRatioValue(shot.doseIn, shot.yieldOut),
      durationSec: shot.extractionTime,
    }))
    .filter((point) => point.extractionRatio !== null || point.durationSec > 0);
}

/** Chronological home pulls with bean age, grind, and humidity for context charts. */
export function buildHomeAnalyticsSeries(shots: Shot[], beans: Bean[]): HomeAnalyticsPoint[] {
  const homeShots = shots.filter(isHomeShot);
  const baseSeries = buildShotChartSeries(homeShots);

  return baseSeries.map((point) => {
    const shot = homeShots.find((item) => item.id === point.id);
    const bean = shot ? getBeanById(beans, shot.beanId) : undefined;
    const grindSetting = shot?.grindSetting?.trim() ? shot.grindSetting.trim() : null;

    return {
      ...point,
      beanId: shot?.beanId ?? null,
      beanAgeDays:
        shot?.beanId && bean ? daysSinceRoast(bean.roastDate, point.brewedAt) : null,
      optimalBrewAgeDays: OPTIMAL_BREW_DAYS_TARGET,
      grindSetting,
      grindSettingNumeric: grindSetting ? parseGrindSettingNumeric(grindSetting) : null,
      humidityPercent: shot?.weather?.humidityPercent ?? null,
    };
  });
}

export function hasContextChartData(points: HomeAnalyticsPoint[]): boolean {
  return points.some(
    (point) =>
      point.beanAgeDays !== null ||
      point.humidityPercent !== null ||
      point.grindSettingNumeric !== null,
  );
}

export function hasBeanAgeChartData(points: HomeAnalyticsPoint[]): boolean {
  return points.some((point) => point.beanAgeDays !== null);
}

/** Bean ids that appear on the age chart (known bean with roast date). */
export function getBeanIdsWithAgeInSeries(points: HomeAnalyticsPoint[]): string[] {
  const ids = new Set<string>();
  for (const point of points) {
    if (point.beanId && point.beanAgeDays !== null) ids.add(point.beanId);
  }
  return [...ids].sort();
}

/**
 * One line series per bean so age rises within each bag without zigzagging when you switch beans.
 * Unknown-bean pulls stay off the line (no dot).
 */
export function enrichHomeSeriesForBeanAgeChart(
  points: HomeAnalyticsPoint[],
): HomeAnalyticsChartPoint[] {
  const beanIds = getBeanIdsWithAgeInSeries(points);
  return points.map((point) => {
    const extra: Record<string, number | null> = {};
    for (const beanId of beanIds) {
      extra[`beanAgeLine_${beanId}`] =
        point.beanId === beanId && point.beanAgeDays !== null ? point.beanAgeDays : null;
    }
    return { ...point, ...extra };
  });
}

export function hasGrindOrHumidityChartData(points: HomeAnalyticsPoint[]): boolean {
  return points.some(
    (point) => point.humidityPercent !== null || point.grindSettingNumeric !== null,
  );
}
