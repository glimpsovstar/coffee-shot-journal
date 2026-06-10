import { describe, expect, it } from 'vitest';
import { formatDrinkSummary, isDrinkSelectionComplete } from './drinks';

describe('drinks', () => {
  it('formats drink summary', () => {
    expect(
      formatDrinkSummary({
        milkCategory: 'milk',
        beverageType: 'flat_white',
        shotSize: 'double',
      } as never),
    ).toBe('Milk-based · Flat white · Double');
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
});
