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
  DateTimeDigitized?: Date | string;
  DateCreated?: Date | string;
  latitude?: number;
  longitude?: number;
};

const EXIF_READ_OPTIONS = { reviveValues: true };

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
    parseExifDate(exif.DateTimeDigitized) ??
    parseExifDate(exif.DateCreated) ??
    parseExifDate(exif.ModifyDate)
  );
}

export function formatGpsLocation(latitude: number, longitude: number): string {
  const latHem = latitude >= 0 ? 'N' : 'S';
  const lonHem = longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(latitude).toFixed(5)}° ${latHem}, ${Math.abs(longitude).toFixed(5)}° ${lonHem}`;
}

/** exifr reads ArrayBuffer reliably; Blob can fail outside the browser. */
async function toExifInput(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

async function extractGpsFromBuffer(
  buffer: ArrayBuffer,
): Promise<{ latitude: number; longitude: number } | undefined> {
  try {
    const gps = await exifr.gps(buffer);
    if (
      gps &&
      typeof gps.latitude === 'number' &&
      typeof gps.longitude === 'number' &&
      !Number.isNaN(gps.latitude) &&
      !Number.isNaN(gps.longitude)
    ) {
      return { latitude: gps.latitude, longitude: gps.longitude };
    }
  } catch {
    // fall through to parse()
  }

  try {
    const parsed = (await exifr.parse(buffer, {
      ...EXIF_READ_OPTIONS,
      gps: true,
      pick: ['latitude', 'longitude'],
    })) as ExifPick | null;

    const lat = parsed?.latitude;
    const lon = parsed?.longitude;
    if (
      typeof lat === 'number' &&
      typeof lon === 'number' &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lon)
    ) {
      return { latitude: lat, longitude: lon };
    }
  } catch {
    // no GPS
  }

  return undefined;
}

async function extractDatesFromBuffer(buffer: ArrayBuffer): Promise<ExifPick | null> {
  try {
    return (await exifr.parse(buffer, {
      ...EXIF_READ_OPTIONS,
      tiff: true,
      xmp: true,
      icc: false,
      pick: [
        'DateTimeOriginal',
        'CreateDate',
        'ModifyDate',
        'DateTimeDigitized',
        'DateCreated',
      ],
    })) as ExifPick | null;
  } catch {
    return null;
  }
}

export async function extractGpsFromPhotoBlob(
  blob: Blob,
): Promise<{ latitude: number; longitude: number } | undefined> {
  const buffer = await toExifInput(blob);
  return extractGpsFromBuffer(buffer);
}

export async function extractShotMetadataFromBlob(blob: Blob): Promise<ShotPhotoMetadata> {
  const messages: string[] = [];
  const buffer = await toExifInput(blob);

  const exif = await extractDatesFromBuffer(buffer);
  const brewedAt = exif ? pickBrewedDate(exif) : undefined;
  const gps = await extractGpsFromBuffer(buffer);
  const hasGps = gps !== undefined;

  if (!exif && !hasGps) {
    messages.push(
      'No date or location in this photo. Large uploads are compressed for storage — we still read the original file when possible. If this was exported or edited, try the camera original with Location enabled.',
    );
    return { messages };
  }

  if (brewedAt) {
    messages.push('Set brewed date and time from photo.');
  } else if (exif) {
    messages.push('No date/time found in photo metadata.');
  }

  if (hasGps) {
    messages.push(
      `GPS found (${formatGpsLocation(gps!.latitude, gps!.longitude)}) — suburb filled when possible.`,
    );
  } else {
    messages.push(
      'No GPS in this file. Use an unedited original (Camera roll / Files), with Location enabled when shooting.',
    );
  }

  return {
    brewedAt,
    gps,
    messages,
  };
}

/** Try each blob (e.g. café + coffee photos) and merge the best metadata found. */
export async function extractShotMetadataFromBlobs(blobs: Blob[]): Promise<ShotPhotoMetadata> {
  if (blobs.length === 0) {
    return { messages: ['Attach a photo first.'] };
  }

  let merged: ShotPhotoMetadata | undefined;

  for (const blob of blobs) {
    const result = await extractShotMetadataFromBlob(blob);
    if (!result.brewedAt && !result.gps) continue;

    if (!merged) {
      merged = result;
      continue;
    }

    merged = {
      brewedAt: merged.brewedAt ?? result.brewedAt,
      gps: merged.gps ?? result.gps,
      messages: [...new Set([...merged.messages, ...result.messages])],
    };
  }

  if (merged) return merged;
  return extractShotMetadataFromBlob(blobs[0]!);
}
