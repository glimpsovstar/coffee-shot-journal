import { describe, expect, it } from 'vitest';
import { mockPhoto } from '../test/fixtures';
import { buildCafeCoffeeShot } from './cafeCoffee';

describe('buildCafeCoffeeShot', () => {
  it('builds a café purchased shot with drink options and weather', () => {
    const shot = buildCafeCoffeeShot('cafe-1', {
      beverageType: 'flat_white',
      extraShot: true,
      alternativeMilk: true,
      beanId: 'bean-1',
      brewedAtIso: '2026-06-05T10:00:00.000Z',
      rating: 5,
      tastingNotes: 'Silky',
      priceAud: 6.5,
      wouldOrderAgain: true,
      weather: {
        temperatureC: 18,
        humidityPercent: 55,
        description: 'Clear',
        source: 'open-meteo',
        observedAt: '2026-06-05T10:00:00.000Z',
      },
      photos: [mockPhoto],
    });

    expect(shot.context).toBe('cafe_purchased');
    expect(shot.cafeId).toBe('cafe-1');
    expect(shot.beverageType).toBe('flat_white');
    expect(shot.extraShot).toBe(true);
    expect(shot.alternativeMilk).toBe(true);
    expect(shot.priceAud).toBe(6.5);
    expect(shot.weather?.description).toBe('Clear');
    expect(shot.photos).toHaveLength(1);
    expect(shot.grinder).toBe('');
    expect(shot.doseIn).toBe(0);
  });

  it('omits optional fields when not provided', () => {
    const shot = buildCafeCoffeeShot('cafe-2', {
      beverageType: 'latte',
      extraShot: false,
      alternativeMilk: false,
      beanId: '',
      brewedAtIso: '2026-06-05T10:00:00.000Z',
      rating: 3,
      tastingNotes: '',
      wouldOrderAgain: false,
      photos: [],
    });

    expect(shot.extraShot).toBeUndefined();
    expect(shot.alternativeMilk).toBeUndefined();
    expect(shot.priceAud).toBeUndefined();
    expect(shot.weather).toBeUndefined();
  });
});
