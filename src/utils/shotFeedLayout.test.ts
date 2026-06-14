import { describe, expect, it } from 'vitest';
import { mockShot } from '../test/fixtures';
import { shotFeedSize } from './shotFeedLayout';

describe('shotFeedSize', () => {
  it('widens early high-rated home shots for bento layout', () => {
    expect(shotFeedSize({ ...mockShot, rating: 5 }, 0)).toBe('wide');
    expect(shotFeedSize({ ...mockShot, rating: 4 }, 2)).toBe('wide');
    expect(shotFeedSize({ ...mockShot, rating: 4 }, 5)).toBe('standard');
  });

  it('keeps café visits standard width', () => {
    expect(
      shotFeedSize(
        { ...mockShot, context: 'cafe_purchased', cafeId: 'cafe-1', rating: 5 },
        0,
      ),
    ).toBe('standard');
  });

  it('uses standard size for lower ratings', () => {
    expect(shotFeedSize({ ...mockShot, rating: 3 }, 0)).toBe('standard');
  });
});
