import { AU_NZ_SUBURBS, type SuburbEntry } from '../data/auNzSuburbs';

const EARTH_RADIUS_KM = 6371;

export function formatSuburbLabel(suburb: SuburbEntry): string {
  const countryName = suburb.country === 'AU' ? 'Australia' : 'New Zealand';
  return `${suburb.name}, ${suburb.state}, ${countryName}`;
}

export function searchSuburbs(query: string, limit = 8): SuburbEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return AU_NZ_SUBURBS.filter((suburb) => {
    const label = formatSuburbLabel(suburb).toLowerCase();
    return (
      suburb.name.toLowerCase().includes(q) ||
      suburb.state.toLowerCase().includes(q) ||
      label.includes(q)
    );
  })
    .slice(0, limit);
}

export function getSuburbById(id: string): SuburbEntry | undefined {
  return AU_NZ_SUBURBS.find((s) => s.id === id);
}

/**
 * Resolve typed text to a curated suburb when it clearly matches (no dropdown click).
 */
export function resolveSuburbFromQuery(query: string): SuburbEntry | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();

  const byLabel = AU_NZ_SUBURBS.find(
    (s) => formatSuburbLabel(s).toLowerCase() === lower,
  );
  if (byLabel) return byLabel;

  const byName = AU_NZ_SUBURBS.filter((s) => s.name.toLowerCase() === lower);
  if (byName.length === 1) return byName[0]!;

  const matches = searchSuburbs(trimmed, 20);
  if (matches.length === 1) {
    const only = matches[0]!;
    if (only.name.toLowerCase() === lower) return only;
  }

  // "Wantirna, VIC" — match name segment before comma
  const namePart = trimmed.split(',')[0]?.trim().toLowerCase();
  if (namePart) {
    const byNamePart = AU_NZ_SUBURBS.filter((s) => s.name.toLowerCase() === namePart);
    if (byNamePart.length === 1) return byNamePart[0]!;
  }

  return null;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Suggest nearest curated suburb to GPS (e.g. from iPhone EXIF). */
export function findNearestSuburb(
  latitude: number,
  longitude: number,
  maxDistanceKm = 80,
): SuburbEntry | undefined {
  let best: SuburbEntry | undefined;
  let bestDistance = Infinity;

  for (const suburb of AU_NZ_SUBURBS) {
    const km = distanceKm(latitude, longitude, suburb.latitude, suburb.longitude);
    if (km < bestDistance) {
      bestDistance = km;
      best = suburb;
    }
  }

  return bestDistance <= maxDistanceKm ? best : undefined;
}

export function toStoredSuburb(suburb: SuburbEntry) {
  return {
    id: suburb.id,
    label: formatSuburbLabel(suburb),
    latitude: suburb.latitude,
    longitude: suburb.longitude,
  };
}
