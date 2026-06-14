import { describe, expect, it } from 'vitest';
import { mockShot } from '../test/fixtures';
import { shotFeedSize } from './shotFeedLayout';

describe('shotFeedSize', () => {
  it('returns standard for every shot in the feed', () => {
    expect(shotFeedSize({ ...mockShot, rating: 5 }, 0)).toBe('standard');
    expect(shotFeedSize({ ...mockShot, rating: 4 }, 2)).toBe('standard');
    expect(
      shotFeedSize(
        { ...mockShot, context: 'cafe_purchased', cafeId: 'cafe-1', rating: 5 },
        0,
      ),
    ).toBe('standard');
    expect(shotFeedSize({ ...mockShot, rating: 3 }, 0)).toBe('standard');
  });
});
