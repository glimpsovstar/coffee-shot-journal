import { describe, expect, it } from 'vitest';
import {
  durationVsTarget,
  ESPRESSO_DURATION_MIN_SEC,
  ESPRESSO_RATIO_MIN,
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
});
