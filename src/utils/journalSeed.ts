import { seedBeans, seedShots } from '../data/seed';
import type { Bean, Cafe, Shot } from '../types';

export interface JournalData {
  beans: Bean[];
  shots: Shot[];
  cafes: Cafe[];
}

/** True when journal content differs from bundled seed data (user has local entries). */
export function journalDiffersFromSeed(data: JournalData): boolean {
  return (
    JSON.stringify(data.beans) !== JSON.stringify(seedBeans) ||
    JSON.stringify(data.shots) !== JSON.stringify(seedShots) ||
    data.cafes.length > 0
  );
}

export function collectPhotoIds(beans: Bean[], shots: Shot[], cafes: Cafe[] = []): string[] {
  const ids = new Set<string>();
  for (const bean of beans) {
    for (const photo of bean.photos) ids.add(photo.id);
  }
  for (const shot of shots) {
    for (const photo of shot.photos) ids.add(photo.id);
  }
  for (const cafe of cafes) {
    for (const photo of cafe.photos) ids.add(photo.id);
  }
  return [...ids];
}
