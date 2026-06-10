import { describe, expect, it } from 'vitest';
import { seedBeans, seedShots } from '../data/seed';
import { collectPhotoIds, journalDiffersFromSeed } from './journalSeed';

describe('journalSeed', () => {
  it('detects seed-only journal', () => {
    expect(journalDiffersFromSeed({ beans: seedBeans, shots: seedShots, cafes: [] })).toBe(false);
  });

  it('detects custom beans', () => {
    expect(
      journalDiffersFromSeed({
        beans: [{ ...seedBeans[0], name: 'Custom' }, ...seedBeans.slice(1)],
        shots: seedShots,
        cafes: [],
      }),
    ).toBe(true);
  });

  it('collects unique photo ids', () => {
    const photo = {
      id: 'p1',
      fileName: 'a.jpg',
      mimeType: 'image/jpeg',
      createdAt: '2026-06-01T00:00:00.000Z',
    };
    const ids = collectPhotoIds(
      [{ ...seedBeans[0], photos: [photo] }],
      [{ ...seedShots[0], photos: [photo] }],
    );
    expect(ids).toEqual(['p1']);
  });
});
