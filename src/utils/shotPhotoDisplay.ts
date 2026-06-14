import type { Cafe, Photo, PhotoDisplay, Shot } from '../types';
import { getCafeById } from './cafes';

type ResolvePhotosFn = (photos: Photo[]) => PhotoDisplay[];

/** Shot photos first; for café visits, fall back to photos on the café record. */
export function resolveShotPhotoDisplay(
  shot: Shot,
  cafes: Cafe[],
  resolvePhotos: ResolvePhotosFn,
): PhotoDisplay[] {
  const fromShot = resolvePhotos(shot.photos);
  if (fromShot.length > 0) return fromShot;

  if (shot.cafeId) {
    const cafe = getCafeById(cafes, shot.cafeId);
    if (cafe) {
      const fromCafe = resolvePhotos(cafe.photos);
      if (fromCafe.length > 0) return fromCafe;
    }
  }

  return [];
}

export function shotPhotoMetadataCount(shot: Shot, cafes: Cafe[]): number {
  let count = shot.photos.length;
  if (shot.cafeId) {
    const cafe = getCafeById(cafes, shot.cafeId);
    if (cafe) count += cafe.photos.length;
  }
  return count;
}
