import type { Shot } from '../types';

export type ShotFeedSize = 'featured' | 'wide' | 'standard';

/** Bento-style card sizing: top-rated and recent pulls get more visual weight. */
export function shotFeedSize(shot: Shot, index: number): ShotFeedSize {
  if (shot.rating === 5) return 'featured';
  if (shot.rating >= 4 && index < 4) return 'wide';
  return 'standard';
}
