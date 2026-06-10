import { describe, expect, it } from 'vitest';
import { getHeroCardLayout, HERO_OFFSET_X_OPTIONS } from './floatingHeroLayout';

describe('floatingHeroLayout', () => {
  it('assigns horizontal offsets within ±20%', () => {
    const layout = getHeroCardLayout('shot-1:photo-1', 0);
    expect(HERO_OFFSET_X_OPTIONS).toContain(layout.offsetXPercent);
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
