/** WMO weather codes from Open-Meteo (abbreviated). */
export type WeatherIconVariant =
  | 'clear'
  | 'partly-cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'rain-showers'
  | 'snow-showers'
  | 'thunderstorm'
  | 'unknown';

export function describeWeatherCode(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 86) return 'Snow showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

export function weatherIconVariant(code: number): WeatherIconVariant {
  if (code === 0) return 'clear';
  if (code <= 3) return 'partly-cloudy';
  if (code <= 48) return 'fog';
  if (code <= 57) return 'drizzle';
  if (code <= 67) return 'rain';
  if (code <= 77) return 'snow';
  if (code <= 82) return 'rain-showers';
  if (code <= 86) return 'snow-showers';
  if (code <= 99) return 'thunderstorm';
  return 'unknown';
}

/** Resolve WMO code for shots saved before weatherCode was stored. */
export function resolveWeatherCode(weather: {
  weatherCode?: number;
  description: string;
}): number {
  if (weather.weatherCode !== undefined) return weather.weatherCode;

  const byDescription: Record<string, number> = {
    Clear: 0,
    'Partly cloudy': 2,
    Fog: 45,
    Drizzle: 51,
    Rain: 61,
    Snow: 71,
    'Rain showers': 80,
    'Snow showers': 85,
    Thunderstorm: 95,
  };

  return byDescription[weather.description] ?? 0;
}
