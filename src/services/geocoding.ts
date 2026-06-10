import type { SuburbEntry } from '../data/auNzSuburbs';

interface GeocodingResult {
  results?: {
    id?: number;
    name?: string;
    latitude?: number;
    longitude?: number;
    country_code?: string;
    admin1?: string;
  }[];
}

const AU_STATE_NAMES: Record<string, string> = {
  nsw: 'NSW',
  'new south wales': 'NSW',
  vic: 'VIC',
  victoria: 'VIC',
  qld: 'QLD',
  queensland: 'QLD',
  wa: 'WA',
  'western australia': 'WA',
  sa: 'SA',
  'south australia': 'SA',
  tas: 'TAS',
  tasmania: 'TAS',
  act: 'ACT',
  nt: 'NT',
  'northern territory': 'NT',
};

const NZ_REGION_HINTS = ['auckland', 'wellington', 'canterbury', 'otago', 'waikato', 'bay of plenty'];

export function parseLooseSuburbInput(
  query: string,
): { name: string; state: string; country: 'AU' | 'NZ' } | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const parts = trimmed
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length < 2) return null;

  const name = parts[0]!;
  let statePart = parts[1]!.toLowerCase();
  let country: 'AU' | 'NZ' = 'AU';

  if (parts.length >= 3) {
    const countryPart = parts[parts.length - 1]!.toLowerCase();
    if (countryPart.includes('zealand') || countryPart === 'nz') {
      country = 'NZ';
    }
    if (parts.length > 2 && parts[1]!.toLowerCase() !== countryPart) {
      statePart = parts[1]!.toLowerCase();
    }
  }

  if (NZ_REGION_HINTS.some((r) => statePart.includes(r))) {
    country = 'NZ';
  }

  const state =
    country === 'AU'
      ? (AU_STATE_NAMES[statePart] ?? parts[1]!.toUpperCase())
      : parts[1]!;

  if (!name || !state) return null;
  return { name, state, country };
}

export async function geocodeSuburbInput(parsed: {
  name: string;
  state: string;
  country: 'AU' | 'NZ';
}): Promise<SuburbEntry | null> {
  const countryCode = parsed.country;
  const searchName = `${parsed.name}, ${parsed.state}`;
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', searchName);
  url.searchParams.set('count', '5');
  url.searchParams.set('language', 'en');
  url.searchParams.set('country', countryCode);

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = (await response.json()) as GeocodingResult;
  const hit = data.results?.find(
    (r) =>
      r.latitude !== undefined &&
      r.longitude !== undefined &&
      r.country_code?.toUpperCase() === countryCode,
  );

  if (!hit?.latitude || !hit.longitude) return null;

  const slug = `${parsed.name}-${parsed.state}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  return {
    id: `geocoded-${countryCode.toLowerCase()}-${slug}`,
    name: hit.name ?? parsed.name,
    state: parsed.state,
    country: countryCode,
    latitude: hit.latitude,
    longitude: hit.longitude,
  };
}

export async function resolveSuburbWithGeocoding(query: string): Promise<SuburbEntry | null> {
  const parsed = parseLooseSuburbInput(query);
  if (!parsed) return null;
  return geocodeSuburbInput(parsed);
}

/** Resolve AU/NZ suburb from photo GPS when not in the curated list. */
export interface GeocodedPlace {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}

/** Search for a café or venue by name/address (Open-Meteo geocoding). */
export async function geocodePlaceQuery(query: string): Promise<GeocodedPlace | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', trimmed);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = (await response.json()) as GeocodingResult;
  const hit = data.results?.[0];
  if (!hit?.latitude || !hit.longitude) return null;

  const parts = [hit.name, hit.admin1, hit.country_code].filter(Boolean);
  return {
    name: hit.name ?? trimmed,
    latitude: hit.latitude,
    longitude: hit.longitude,
    address: parts.join(', '),
  };
}

export async function reverseGeocodeSuburb(
  latitude: number,
  longitude: number,
): Promise<SuburbEntry | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/reverse');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = (await response.json()) as GeocodingResult;
  const hit = data.results?.[0];
  const countryCode = hit?.country_code?.toUpperCase();
  if (
    !hit?.latitude ||
    !hit.longitude ||
    (countryCode !== 'AU' && countryCode !== 'NZ')
  ) {
    return null;
  }

  const country = countryCode as 'AU' | 'NZ';
  const state =
    country === 'AU'
      ? (AU_STATE_NAMES[hit.admin1?.toLowerCase() ?? ''] ?? hit.admin1 ?? '')
      : (hit.admin1 ?? '');

  const name = hit.name ?? 'Unknown';
  const slug = `${name}-${state}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    id: `geocoded-${country.toLowerCase()}-${slug}`,
    name,
    state: state || name,
    country,
    latitude: hit.latitude,
    longitude: hit.longitude,
  };
}
