import { describe, expect, it } from 'vitest';
import { findNearestSuburb, formatSuburbLabel, searchSuburbs } from './suburbs';

describe('suburbs', () => {
  it('formats AU and NZ labels', () => {
    expect(
      formatSuburbLabel({
        id: 'x',
        name: 'Fitzroy',
        state: 'VIC',
        country: 'AU',
        latitude: 0,
        longitude: 0,
      }),
    ).toBe('Fitzroy, VIC, Australia');
  });

  it('searches by suburb name', () => {
    const results = searchSuburbs('fitz');
    expect(results.some((s) => s.name === 'Fitzroy')).toBe(true);
  });

  it('finds nearest suburb to Melbourne CBD coordinates', () => {
    const nearest = findNearestSuburb(-37.8136, 144.9631);
    expect(nearest?.name).toBe('Melbourne');
  });
});
