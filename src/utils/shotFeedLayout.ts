import type { Shot } from '../types';
import { isCafeShot } from './shots';

export type ShotFeedSize = 'wide' | 'standard';

/**
 * Bento sizing for the shot feed — wide home shots span two columns in the 3-column grid.
 * Café visits stay standard so the grid stays 2–3 tiles per row.
 */
export function shotFeedSize(shot: Shot, index: number): ShotFeedSize {
  if (isCafeShot(shot)) return 'standard';
  if (shot.rating >= 4 && index < 4) return 'wide';
  return 'standard';
}
