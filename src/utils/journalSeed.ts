import { seedBeans, seedShots } from '../data/seed';
import type { Bean, Shot } from '../types';

export interface JournalData {
  beans: Bean[];
  shots: Shot[];
}

/** True when journal content differs from bundled seed data (user has local entries). */
export function journalDiffersFromSeed(data: JournalData): boolean {
  return (
    JSON.stringify(data.beans) !== JSON.stringify(seedBeans) ||
    JSON.stringify(data.shots) !== JSON.stringify(seedShots)
  );
}

export function collectPhotoIds(beans: Bean[], shots: Shot[]): string[] {
  const ids = new Set<string>();
  for (const bean of beans) {
    for (const photo of bean.photos) ids.add(photo.id);
  }
  for (const shot of shots) {
    for (const photo of shot.photos) ids.add(photo.id);
  }
  return [...ids];
}
