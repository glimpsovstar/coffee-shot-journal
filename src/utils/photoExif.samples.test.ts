import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractShotMetadataFromBlob } from './photoExif';

const SAMPLES_DIR = join(process.cwd(), 'samples/Photos');

describe('sample photos (local fixtures)', () => {
  const iphoneOriginal = join(
    SAMPLES_DIR,
    '7E89429B-930B-4C43-909F-7C9F6F7897EC_1_105_c.jpeg',
  );
  const whatsapp = join(SAMPLES_DIR, 'WhatsApp Image 2026-06-05 at 10.10.57 (1).jpeg');

  it('reads GPS and date from iPhone original', async () => {
    if (!existsSync(iphoneOriginal)) return;

    const buffer = readFileSync(iphoneOriginal);
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    const result = await extractShotMetadataFromBlob(blob);

    expect(result.brewedAt).toBeInstanceOf(Date);
    expect(result.gps?.latitude).toBeCloseTo(-37.857, 2);
    expect(result.gps?.longitude).toBeCloseTo(145.222, 2);
    expect(result.messages.some((m) => m.includes('GPS found'))).toBe(true);
  });

  it('reports no metadata on WhatsApp-compressed image', async () => {
    if (!existsSync(whatsapp)) return;

    const buffer = readFileSync(whatsapp);
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    const result = await extractShotMetadataFromBlob(blob);

    expect(result.gps).toBeUndefined();
    expect(result.brewedAt).toBeUndefined();
    expect(result.messages[0]).toMatch(/WhatsApp|No date or location/i);
  });
});
