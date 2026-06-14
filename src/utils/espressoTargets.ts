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
