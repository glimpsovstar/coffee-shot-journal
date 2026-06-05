import type { Bean, Shot } from '../types';

export function getBeanById(beans: Bean[], id: string): Bean | undefined {
  return beans.find((bean) => bean.id === id);
}

export function formatBrewedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatRoastDate(isoDate: string): string {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString(undefined, {
    dateStyle: 'medium',
  });
}

export function getShotLocationLabel(shot: Shot): string | undefined {
  return shot.brewSuburb?.label ?? shot.brewedLocation;
}

export function hasShotRecipe(shot: Shot): boolean {
  return shot.doseIn > 0 && shot.yieldOut > 0 && shot.extractionTime > 0;
}

export function hasShotGrinder(shot: Shot): boolean {
  return Boolean(shot.grinder.trim() && shot.grindSetting.trim());
}

export function ratio(doseIn: number, yieldOut: number): string {
  if (doseIn <= 0) return '—';
  return `1:${(yieldOut / doseIn).toFixed(1)}`;
}

export function sortShotsNewestFirst<T extends { brewedAt: string }>(
  shots: T[],
): T[] {
  return [...shots].sort(
    (a, b) => new Date(b.brewedAt).getTime() - new Date(a.brewedAt).getTime(),
  );
}
