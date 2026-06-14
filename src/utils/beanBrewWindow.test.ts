import { describe, expect, it } from 'vitest';
import {
  brewWindowPhase,
  chartBeanAgeDomain,
  daysUntilOptimalBrew,
  formatBrewWindowPhase,
  OPTIMAL_BREW_DAYS_MAX,
  OPTIMAL_BREW_DAYS_MIN,
  OPTIMAL_BREW_DAYS_TARGET,
} from './beanBrewWindow';

describe('beanBrewWindow', () => {
  it('classifies degassing and optimal phases', () => {
    expect(brewWindowPhase(3)).toBe('degassing');
    expect(brewWindowPhase(8)).toBe('approaching_optimal');
    expect(brewWindowPhase(14)).toBe('optimal');
    expect(brewWindowPhase(OPTIMAL_BREW_DAYS_MAX)).toBe('optimal');
    expect(brewWindowPhase(30)).toBe('aging');
  });

  it('formats phase labels for recommendations', () => {
    expect(formatBrewWindowPhase(4)).toMatch(/degassing/i);
    expect(formatBrewWindowPhase(14)).toMatch(/optimal window/i);
  });

  it('counts days until optimal brew target', () => {
    expect(daysUntilOptimalBrew(10)).toBe(OPTIMAL_BREW_DAYS_TARGET - 10);
    expect(daysUntilOptimalBrew(OPTIMAL_BREW_DAYS_TARGET)).toBeNull();
  });

  it('extends chart domain to include brew window markers', () => {
    const [min, max] = chartBeanAgeDomain([5, 33]);
    expect(min).toBeLessThanOrEqual(0);
    expect(max).toBeGreaterThanOrEqual(OPTIMAL_BREW_DAYS_MAX);
    expect(max).toBeGreaterThanOrEqual(33);
  });

  it('includes optimal window bounds in domain for young beans', () => {
    const [min, max] = chartBeanAgeDomain([3, 5]);
    expect(min).toBeLessThanOrEqual(OPTIMAL_BREW_DAYS_MIN);
    expect(max).toBeGreaterThanOrEqual(OPTIMAL_BREW_DAYS_MAX);
  });
});
