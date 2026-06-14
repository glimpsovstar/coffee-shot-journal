import type { Cafe, Shot } from '../types';
import { formatDrinkSummary } from './drinks';
import { formatBrewedAt, getShotsForCafe } from './shots';

const MAX_OLDER_VISITS = 5;
const PLACEMARK_ID_PREFIX = 'coffeesnob-cafe-';

export interface CafeMapKmlResult {
  kml: string;
  exportedCount: number;
  skippedCount: number;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdataSafe(html: string): string {
  return html.replace(/]]>/g, ']]&gt;');
}

function starLabel(rating: number): string {
  const filled = '★'.repeat(Math.min(5, Math.max(0, rating)));
  const empty = '☆'.repeat(5 - filled.length);
  return `${filled}${empty} (${rating}/5)`;
}

function formatVisitSummary(shot: Shot): string {
  const parts: string[] = [formatBrewedAt(shot.brewedAt)];
  const drink = formatDrinkSummary(shot);
  if (drink) parts.push(drink);
  parts.push(starLabel(shot.rating));
  if (shot.tastingNotes?.trim()) parts.push(shot.tastingNotes.trim());
  if (shot.priceAud !== undefined && shot.priceAud > 0) {
    parts.push(`$${shot.priceAud} AUD`);
  }
  if (shot.wouldOrderAgain === false) parts.push('Would not order again');
  return parts.join(' — ');
}

function buildPlacemarkDescription(cafe: Cafe, cafeShots: Shot[]): string {
  const lines: string[] = [];

  if (cafe.address) {
    lines.push(`<p><strong>Address:</strong> ${escapeXml(cafe.address)}</p>`);
  }

  lines.push(`<p><strong>Visits logged:</strong> ${cafeShots.length}</p>`);

  if (cafeShots.length > 0) {
    const latest = cafeShots[0]!;
    lines.push(`<p><strong>Latest visit:</strong> ${escapeXml(formatVisitSummary(latest))}</p>`);

    const older = cafeShots.slice(1, MAX_OLDER_VISITS + 1);
    if (older.length > 0) {
      lines.push('<p><strong>Earlier visits:</strong></p><ul>');
      for (const shot of older) {
        lines.push(`<li>${escapeXml(formatVisitSummary(shot))}</li>`);
      }
      lines.push('</ul>');
    }
  }

  if (cafe.notes.trim()) {
    lines.push(`<p><strong>Café notes:</strong> ${escapeXml(cafe.notes.trim())}</p>`);
  }

  return lines.join('');
}

function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function buildCafeMapKml(cafes: Cafe[], shots: Shot[], exportedAt = new Date()): CafeMapKmlResult {
  const placemarks: string[] = [];
  let skippedCount = 0;

  for (const cafe of cafes) {
    if (!isValidCoordinate(cafe.latitude, cafe.longitude)) {
      skippedCount += 1;
      continue;
    }

    const cafeShots = getShotsForCafe(shots, cafe.id);
    const description = buildPlacemarkDescription(cafe, cafeShots);
    const extendedData = [
      `<Data name="cafeId"><value>${escapeXml(cafe.id)}</value></Data>`,
      cafe.googlePlaceId
        ? `<Data name="googlePlaceId"><value>${escapeXml(cafe.googlePlaceId)}</value></Data>`
        : '',
      `<Data name="visitCount"><value>${cafeShots.length}</value></Data>`,
      cafeShots[0]
        ? `<Data name="latestRating"><value>${cafeShots[0].rating}</value></Data>`
        : '',
    ]
      .filter(Boolean)
      .join('');

    placemarks.push(
      `<Placemark id="${escapeXml(`${PLACEMARK_ID_PREFIX}${cafe.id}`)}">` +
        `<name>${escapeXml(cafe.name)}</name>` +
        `<description><![CDATA[${cdataSafe(description)}]]></description>` +
        `<ExtendedData>${extendedData}</ExtendedData>` +
        `<Point><coordinates>${cafe.longitude},${cafe.latitude},0</coordinates></Point>` +
        `</Placemark>`,
    );
  }

  const exportedAtIso = exportedAt.toISOString();
  const kml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<kml xmlns="http://www.opengis.net/kml/2.2">` +
    `<Document>` +
    `<name>Coffee Snob — Café map</name>` +
    `<description>Exported ${escapeXml(exportedAtIso)}. Import into Google My Maps.</description>` +
    placemarks.join('') +
    `</Document>` +
    `</kml>`;

  return {
    kml,
    exportedCount: placemarks.length,
    skippedCount,
  };
}

export function downloadCafeMapKmlFile(cafes: Cafe[], shots: Shot[]): CafeMapKmlResult {
  const result = buildCafeMapKml(cafes, shots);
  const blob = new Blob([result.kml], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `coffee-snob-cafes-${date}.kml`;
  anchor.click();
  URL.revokeObjectURL(url);
  return result;
}
