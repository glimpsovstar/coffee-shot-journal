import type { Cafe, NewCafe } from '../types';

export function normalizeCafe(cafe: Cafe): Cafe {
  return {
    ...cafe,
    name: cafe.name.trim(),
    address: cafe.address?.trim() ?? '',
    notes: cafe.notes?.trim() ?? '',
    photos: cafe.photos ?? [],
    googlePlaceId: cafe.googlePlaceId?.trim() || undefined,
  };
}

export function getCafeById(cafes: Cafe[], id: string): Cafe | undefined {
  return cafes.find((cafe) => cafe.id === id);
}

export function createCafeFromDraft(draft: NewCafe): Cafe {
  return normalizeCafe({
    ...draft,
    id: crypto.randomUUID(),
  });
}
