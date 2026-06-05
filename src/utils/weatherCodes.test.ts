import { describe, expect, it } from 'vitest';
import {
  describeWeatherCode,
  resolveWeatherCode,
  weatherIconVariant,
} from './weatherCodes';

describe('weatherCodes', () => {
  it('maps WMO codes to descriptions and icon variants', () => {
    expect(describeWeatherCode(0)).toBe('Clear');
    expect(weatherIconVariant(0)).toBe('clear');
    expect(describeWeatherCode(51)).toBe('Drizzle');
    expect(weatherIconVariant(51)).toBe('drizzle');
    expect(weatherIconVariant(95)).toBe('thunderstorm');
  });

  it('resolves legacy weather without stored code from description', () => {
    expect(
      resolveWeatherCode({ description: 'Drizzle' }),
    ).toBe(51);
    expect(
      resolveWeatherCode({ weatherCode: 61, description: 'Rain' }),
    ).toBe(61);
  });
});
