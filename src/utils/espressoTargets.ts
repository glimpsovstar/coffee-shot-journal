/** Typical home espresso guides for charts and hints—not strict rules. */
export const ESPRESSO_TARGET_RATIO = 2;
export const ESPRESSO_RATIO_MIN = 1.8;
export const ESPRESSO_RATIO_MAX = 2.2;
export const ESPRESSO_DURATION_MIN_SEC = 25;
export const ESPRESSO_DURATION_MAX_SEC = 32;
export const ESPRESSO_DURATION_TARGET_SEC = 28;

export const ESPRESSO_TARGET_SUMMARY =
  'Typical espresso window: ratio 1:1.8–1:2.2 (sweet spot 1:2), pull time 25–32s (sweet spot ~28s).';

export type TargetComparison = 'below' | 'within' | 'above';

export function durationVsTarget(durationSec: number): TargetComparison | null {
  if (durationSec <= 0) return null;
  if (durationSec < ESPRESSO_DURATION_MIN_SEC) return 'below';
  if (durationSec > ESPRESSO_DURATION_MAX_SEC) return 'above';
  return 'within';
}

export function ratioVsTarget(ratio: number): TargetComparison | null {
  if (ratio <= 0) return null;
  if (ratio < ESPRESSO_RATIO_MIN) return 'below';
  if (ratio > ESPRESSO_RATIO_MAX) return 'above';
  return 'within';
}

export function ratioDeltaFromSweetSpot(ratio: number): number {
  return ratio - ESPRESSO_TARGET_RATIO;
}

export function durationDeltaFromSweetSpot(durationSec: number): number {
  return durationSec - ESPRESSO_DURATION_TARGET_SEC;
}

/** How far a logged ratio is from the 1:2 sweet spot. */
export function formatRatioSweetSpotDelta(ratio: number): string {
  const delta = ratioDeltaFromSweetSpot(ratio);
  if (Math.abs(delta) < 0.05) return 'on sweet spot (1:2)';
  const magnitude = Math.abs(delta).toFixed(1);
  return delta > 0 ? `${magnitude} above 1:2` : `${magnitude} below 1:2`;
}

/** How far a logged pull time is from the ~28s sweet spot. */
export function formatDurationSweetSpotDelta(durationSec: number): string {
  const delta = durationDeltaFromSweetSpot(durationSec);
  if (Math.abs(delta) < 1) return `on sweet spot (~${ESPRESSO_DURATION_TARGET_SEC}s)`;
  if (delta > 0) return `${delta}s slower than ~${ESPRESSO_DURATION_TARGET_SEC}s`;
  return `${Math.abs(delta)}s faster than ~${ESPRESSO_DURATION_TARGET_SEC}s`;
}

export function chartRatioDomain(ratios: number[]): [number, number] {
  const values = [...ratios, ESPRESSO_RATIO_MIN, ESPRESSO_RATIO_MAX, ESPRESSO_TARGET_RATIO];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(0.15, (max - min) * 0.12);
  return [min - pad, max + pad];
}

export function chartDurationDomain(durations: number[]): [number, number] {
  const values = [
    ...durations,
    ESPRESSO_DURATION_MIN_SEC,
    ESPRESSO_DURATION_MAX_SEC,
    ESPRESSO_DURATION_TARGET_SEC,
  ];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(2, (max - min) * 0.12);
  return [min - pad, max + pad];
}
