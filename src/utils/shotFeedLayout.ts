import type { Shot } from '../types';

export type ShotFeedSize = 'standard';

/** Uniform feed cards — same width and layout for every shot. */
export function shotFeedSize(_shot: Shot, _index: number): ShotFeedSize {
  return 'standard';
}
