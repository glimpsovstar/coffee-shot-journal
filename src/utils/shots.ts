import type { Bean, Cafe, Shot } from '../types';
import { formatBeanChoiceLabel } from './beans';
import { getCafeById } from './cafes';

export function getShotContext(shot: Shot): Shot['context'] {
  return shot.context ?? 'home_pulled';
}

export function isCafeShot(shot: Shot): boolean {
  return getShotContext(shot) === 'cafe_purchased';
}

export function isHomeShot(shot: Shot): boolean {
  return !isCafeShot(shot);
}

export function getBeanById(beans: Bean[], id: string): Bean | undefined {
  return beans.find((bean) => bean.id === id);
}

export function getShotsForCafe(shots: Shot[], cafeId: string): Shot[] {
  return sortShotsNewestFirst(shots.filter((shot) => shot.cafeId === cafeId));
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
  if (isCafeShot(shot)) return false;
  return shot.doseIn > 0 && shot.yieldOut > 0 && shot.extractionTime > 0;
}

export function hasShotGrinder(shot: Shot): boolean {
  if (isCafeShot(shot)) return false;
  return Boolean(shot.grinder?.trim() && shot.grindSetting?.trim());
}

export function getShotCardTitle(
  shot: Shot,
  beans: Bean[],
  cafes: Cafe[],
): string {
  if (isCafeShot(shot)) {
    const cafe = shot.cafeId ? getCafeById(cafes, shot.cafeId) : undefined;
    return cafe?.name ?? 'Café visit';
  }
  const bean = getBeanById(beans, shot.beanId);
  return bean ? formatBeanChoiceLabel(bean) : 'Unknown bean';
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
