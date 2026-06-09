import type { Shot } from '../types';
import { formatBrewedAt, hasShotRecipe, sortShotsNewestFirst } from './shots';

export interface ShotChartPoint {
  id: string;
  label: string;
  brewedAt: string;
  extractionRatio: number | null;
  durationSec: number;
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
