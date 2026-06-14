import { describe, expect, it } from 'vitest';
import type { Cafe, Photo, PhotoDisplay, Shot } from '../types';
import { mockShot } from '../test/fixtures';
import { resolveShotPhotoDisplay, shotPhotoMetadataCount } from './shotPhotoDisplay';

const photoA: Photo = {
  id: 'photo-a',
  fileName: 'a.jpg',
  mimeType: 'image/jpeg',
  createdAt: '2026-06-01T00:00:00Z',
};

const photoB: Photo = {
  id: 'photo-b',
  fileName: 'b.jpg',
  mimeType: 'image/jpeg',
  createdAt: '2026-06-01T00:00:00Z',
};

function resolvePhotos(photos: Photo[]): PhotoDisplay[] {
  return photos.map((photo) => ({ photo, url: `blob:${photo.id}` }));
}

describe('resolveShotPhotoDisplay', () => {
  it('prefers photos on the shot record', () => {
    const shot: Shot = { ...mockShot, photos: [photoA] };
    const items = resolveShotPhotoDisplay(shot, [], resolvePhotos);
    expect(items).toHaveLength(1);
    expect(items[0]?.photo.id).toBe('photo-a');
  });

  it('falls back to café photos for café visits', () => {
    const cafe: Cafe = {
      id: 'cafe-1',
      name: 'Test Café',
      latitude: 0,
      longitude: 0,
      notes: '',
      photos: [photoB],
    };
    const shot: Shot = {
      ...mockShot,
      context: 'cafe_purchased',
      cafeId: cafe.id,
      photos: [],
    };

    const items = resolveShotPhotoDisplay(shot, [cafe], resolvePhotos);
    expect(items).toHaveLength(1);
    expect(items[0]?.photo.id).toBe('photo-b');
  });
});

describe('shotPhotoMetadataCount', () => {
  it('counts shot and café photo metadata', () => {
    const cafe: Cafe = {
      id: 'cafe-1',
      name: 'Test Café',
      latitude: 0,
      longitude: 0,
      notes: '',
      photos: [photoB],
    };
    const shot: Shot = {
      ...mockShot,
      context: 'cafe_purchased',
      cafeId: cafe.id,
      photos: [photoA],
    };

    expect(shotPhotoMetadataCount(shot, [cafe])).toBe(2);
  });
});
