import { describe, expect, it } from 'vitest';
import {
  formatDrinkSummary,
  isCafeDrinkComplete,
  isDrinkSelectionComplete,
  milkCategoryForBeverage,
  shotSizeFromExtraShot,
} from './drinks';

describe('drinks', () => {
  it('formats drink summary with extra shot and alt milk', () => {
    expect(
      formatDrinkSummary({
        beverageType: 'flat_white',
        extraShot: true,
        alternativeMilk: true,
        shotSize: 'double',
      } as never),
    ).toBe('Flat white · extra shot · alt milk');
  });

  it('infers milk category from beverage', () => {
    expect(milkCategoryForBeverage('magic')).toBe('milk');
    expect(milkCategoryForBeverage('affogato')).toBe('milk');
    expect(milkCategoryForBeverage('long_black')).toBe('black');
  });

  it('maps extra shot to double size', () => {
    expect(shotSizeFromExtraShot(true)).toBe('double');
    expect(shotSizeFromExtraShot(false)).toBe('single');
  });

  it('validates cafe drink selection', () => {
    expect(isCafeDrinkComplete('')).toBe(false);
    expect(isCafeDrinkComplete('latte')).toBe(true);
  });

  it('validates custom shot size needs label', () => {
    expect(
      isDrinkSelectionComplete({
        milkCategory: 'black',
        beverageType: 'espresso',
        shotSize: 'custom',
        shotSizeCustom: '',
      }),
    ).toBe(false);
    expect(
      isDrinkSelectionComplete({
        milkCategory: 'black',
        beverageType: 'espresso',
        shotSize: 'custom',
        shotSizeCustom: 'Triple ristretto',
      }),
    ).toBe(true);
  });

  it('formats long black with water and espresso volumes', () => {
    expect(
      formatDrinkSummary({
        beverageType: 'long_black',
        longBlackWaterMl: 150,
        longBlackEspressoMl: 40,
        milkCategory: 'black',
        shotSize: 'single',
      } as never),
    ).toContain('150ml water · 40ml espresso');
  });
});
