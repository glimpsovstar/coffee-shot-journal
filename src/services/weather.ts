import type { ShotWeather } from '../types';
import { describeWeatherCode } from '../utils/weatherCodes';

interface HourlyWeatherResponse {
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
    weather_code?: number[];
  };
}

function formatDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function pickHourIndex(times: string[], target: Date): number {
  const targetMs = target.getTime();
  let bestIndex = 0;
  let bestDiff = Infinity;

  for (let i = 0; i < times.length; i++) {
    const parsed = new Date(times[i]!);
    const diff = Math.abs(parsed.getTime() - targetMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function parseHourlyWeather(data: HourlyWeatherResponse, at: Date): ShotWeather | null {
  const hourly = data.hourly;
  if (!hourly?.time?.length) return null;

  const index = pickHourIndex(hourly.time, at);
  const temperatureC = hourly.temperature_2m?.[index];
  const humidityPercent = hourly.relative_humidity_2m?.[index];
  const code = hourly.weather_code?.[index];

  if (temperatureC === undefined || humidityPercent === undefined || code === undefined) {
    return null;
  }

  return {
    temperatureC: Math.round(temperatureC * 10) / 10,
    humidityPercent: Math.round(humidityPercent),
    description: describeWeatherCode(code),
    source: 'open-meteo',
    observedAt: hourly.time[index]!,
  };
}

async function fetchHourlyArchive(
  latitude: number,
  longitude: number,
  at: Date,
): Promise<ShotWeather | null> {
  const date = formatDateParam(at);
  const url = new URL('https://archive-api.open-meteo.com/v1/archive');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('start_date', date);
  url.searchParams.set('end_date', date);
  url.searchParams.set(
    'hourly',
    'temperature_2m,relative_humidity_2m,weather_code',
  );
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather lookup failed (${response.status}).`);
  }

  const data = (await response.json()) as HourlyWeatherResponse;
  return parseHourlyWeather(data, at);
}

async function fetchHourlyForecast(
  latitude: number,
  longitude: number,
  at: Date,
): Promise<ShotWeather | null> {
  const date = formatDateParam(at);
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,weather_code');
  url.searchParams.set('start_date', date);
  url.searchParams.set('end_date', date);
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather lookup failed (${response.status}).`);
  }

  const data = (await response.json()) as HourlyWeatherResponse;
  return parseHourlyWeather(data, at);
}

/** Weather at brewed time for a suburb coordinate (Open-Meteo, no API key). */
export async function fetchWeatherAt(params: {
  latitude: number;
  longitude: number;
  at: Date;
}): Promise<ShotWeather> {
  const now = new Date();
  const daysAgo = (now.getTime() - params.at.getTime()) / (1000 * 60 * 60 * 24);
  const useForecast = daysAgo <= 2 && params.at.getTime() <= now.getTime() + 1000 * 60 * 60;

  const weather = useForecast
    ? await fetchHourlyForecast(params.latitude, params.longitude, params.at)
    : await fetchHourlyArchive(params.latitude, params.longitude, params.at);

  if (!weather) {
    throw new Error('No weather data for that date and location.');
  }

  return weather;
}
