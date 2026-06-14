import { describe, expect, it } from 'vitest';
import {
  durationVsTarget,
  ESPRESSO_DURATION_MIN_SEC,
  ESPRESSO_RATIO_MIN,
  ESPRESSO_RATIO_MAX,
  ESPRESSO_DURATION_MAX_SEC,
  formatDurationSweetSpotDelta,
  formatRatioSweetSpotDelta,
  chartDurationDomain,
  chartRatioDomain,
  ratioVsTarget,
} from './espressoTargets';

describe('espressoTargets', () => {
  it('classifies duration against typical window', () => {
    expect(durationVsTarget(20)).toBe('below');
    expect(durationVsTarget(28)).toBe('within');
    expect(durationVsTarget(35)).toBe('above');
  });

  it('classifies ratio against typical window', () => {
    expect(ratioVsTarget(1.7)).toBe('below');
    expect(ratioVsTarget(2)).toBe('within');
    expect(ratioVsTarget(2.3)).toBe('above');
  });

  it('exports guide thresholds', () => {
    expect(ESPRESSO_DURATION_MIN_SEC).toBe(25);
    expect(ESPRESSO_RATIO_MIN).toBe(1.8);
  });

  it('formats sweet spot deltas', () => {
    expect(formatRatioSweetSpotDelta(2)).toMatch(/on sweet spot/i);
    expect(formatRatioSweetSpotDelta(2.2)).toMatch(/above 1:2/);
    expect(formatDurationSweetSpotDelta(28)).toMatch(/on sweet spot/i);
    expect(formatDurationSweetSpotDelta(22)).toMatch(/faster/);
  });

  it('builds chart domains that include sweet spot lines', () => {
    const [ratioMin, ratioMax] = chartRatioDomain([2]);
    expect(ratioMin).toBeLessThanOrEqual(ESPRESSO_RATIO_MIN);
    expect(ratioMax).toBeGreaterThanOrEqual(ESPRESSO_RATIO_MAX);
    const [durMin, durMax] = chartDurationDomain([28]);
    expect(durMin).toBeLessThanOrEqual(ESPRESSO_DURATION_MIN_SEC);
    expect(durMax).toBeGreaterThanOrEqual(ESPRESSO_DURATION_MAX_SEC);
  });
});
