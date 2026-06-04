import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWeatherAt } from './weather';

describe('fetchWeatherAt', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses hourly archive response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          hourly: {
            time: ['2026-06-04T08:00', '2026-06-04T09:00', '2026-06-04T10:00'],
            temperature_2m: [14, 16, 18],
            relative_humidity_2m: [70, 65, 60],
            weather_code: [1, 2, 3],
          },
        }),
      }),
    );

    const weather = await fetchWeatherAt({
      latitude: -37.81,
      longitude: 144.96,
      at: new Date('2026-06-04T09:30:00'),
    });

    expect(weather.temperatureC).toBe(16);
    expect(weather.humidityPercent).toBe(65);
    expect(weather.description).toMatch(/cloud/i);
    expect(weather.source).toBe('open-meteo');
  });
});
