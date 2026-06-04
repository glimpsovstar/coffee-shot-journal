import type { Bean } from '../types';

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
