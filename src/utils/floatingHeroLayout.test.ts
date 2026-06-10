import { describe, expect, it } from 'vitest';
import {
  getHeroCardLayout,
  HERO_OVERLAP_MAX,
  HERO_OVERLAP_MIN,
  HERO_ROTATION_MAX,
  HERO_ROTATION_MIN,
} from './floatingHeroLayout';

describe('floatingHeroLayout', () => {
  it('assigns rotation within ±20°', () => {
    const layout = getHeroCardLayout('shot-1:photo-1', 0);
    expect(layout.rotationDeg).toBeGreaterThanOrEqual(HERO_ROTATION_MIN);
    expect(layout.rotationDeg).toBeLessThanOrEqual(HERO_ROTATION_MAX);
  });

  it('assigns variable overlap for cards after the first', () => {
    const layout = getHeroCardLayout('shot-1:photo-2', 1);
    expect(layout.overlapFactor).toBeGreaterThanOrEqual(HERO_OVERLAP_MIN);
    expect(layout.overlapFactor).toBeLessThanOrEqual(HERO_OVERLAP_MAX);
  });

  it('does not overlap the first card', () => {
    expect(getHeroCardLayout('shot-1:photo-1', 0).overlapFactor).toBe(0);
  });

  it('is stable for the same card id', () => {
    const a = getHeroCardLayout('shot-a:photo-b', 2);
    const b = getHeroCardLayout('shot-a:photo-b', 2);
    expect(a).toEqual(b);
  });

  it('increases z-index with index for overlap stacking', () => {
    expect(getHeroCardLayout('x:1', 0).zIndex).toBe(1);
    expect(getHeroCardLayout('x:2', 4).zIndex).toBe(5);
  });
});
