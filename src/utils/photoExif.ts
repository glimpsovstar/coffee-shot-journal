import exifr from 'exifr';

export interface ShotPhotoMetadata {
  brewedAt?: Date;
  gps?: { latitude: number; longitude: number };
  messages: string[];
}

type ExifPick = {
  DateTimeOriginal?: Date | string;
  CreateDate?: Date | string;
  ModifyDate?: Date | string;
  latitude?: number;
  longitude?: number;
};

function parseExifDate(value: Date | string | undefined): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function pickBrewedDate(exif: ExifPick): Date | undefined {
  return (
    parseExifDate(exif.DateTimeOriginal) ??
    parseExifDate(exif.CreateDate) ??
    parseExifDate(exif.ModifyDate)
  );
}

export function formatGpsLocation(latitude: number, longitude: number): string {
  const latHem = latitude >= 0 ? 'N' : 'S';
  const lonHem = longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(latitude).toFixed(5)}° ${latHem}, ${Math.abs(longitude).toFixed(5)}° ${lonHem}`;
}

export async function extractShotMetadataFromBlob(blob: Blob): Promise<ShotPhotoMetadata> {
  const messages: string[] = [];

  let exif: ExifPick | null = null;
  try {
    exif = (await exifr.parse(blob, {
      gps: true,
      pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate', 'latitude', 'longitude'],
    })) as ExifPick | null;
  } catch {
    messages.push('Could not read metadata from this image.');
    return { messages };
  }

  if (!exif) {
    messages.push('No metadata found in this photo (common after messaging apps or edits).');
    return { messages };
  }

  const brewedAt = pickBrewedDate(exif);
  const lat = exif.latitude;
  const lon = exif.longitude;
  const hasGps =
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lon);

  if (brewedAt) {
    messages.push('Set brewed date and time from photo.');
  } else {
    messages.push('No date/time found in photo metadata.');
  }

  if (hasGps) {
    messages.push('GPS found — pick the nearest suburb from suggestions.');
  } else {
    messages.push('No GPS in photo (enable Location when taking iPhone photos).');
  }

  return {
    brewedAt,
    gps: hasGps ? { latitude: lat!, longitude: lon! } : undefined,
    messages,
  };
}
