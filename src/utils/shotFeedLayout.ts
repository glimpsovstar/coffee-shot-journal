import type { Shot } from '../types';

export type ShotFeedSize = 'standard';

/** Equal-width bento tiles — three per row on desktop. */
export function shotFeedSize(_shot: Shot, _index: number): ShotFeedSize {
  return 'standard';
}
