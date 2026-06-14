import type { Shot } from '../types';

export type ShotFeedSize = 'wide' | 'standard';

/**
 * Bento sizing for the shot feed — wide cards span two columns in the 3-column grid.
 * No full-width "featured" row (keeps tiles small and horizontal).
 */
export function shotFeedSize(shot: Shot, index: number): ShotFeedSize {
  if (shot.rating >= 4 && index < 4) return 'wide';
  return 'standard';
}
