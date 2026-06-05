import { describe, expect, it } from 'vitest';
import {
  findNearestSuburb,
  formatSuburbLabel,
  resolveSuburbFromQuery,
  searchSuburbs,
} from './suburbs';

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

  it('includes Sydney metro NSW suburbs Epping and Strathfield', () => {
    expect(searchSuburbs('epping').some((s) => s.id === 'au-nsw-epping')).toBe(true);
    expect(searchSuburbs('strathfield').some((s) => s.id === 'au-nsw-strathfield')).toBe(true);
    expect(resolveSuburbFromQuery('Epping, NSW')?.id).toBe('au-nsw-epping');
    expect(resolveSuburbFromQuery('Strathfield, NSW')?.id).toBe('au-nsw-strathfield');
  });

  it('resolves exact label or unique name without dropdown selection', () => {
    expect(resolveSuburbFromQuery('Fitzroy, VIC, Australia')?.name).toBe('Fitzroy');
    expect(resolveSuburbFromQuery('Melbourne')?.name).toBe('Melbourne');
    expect(resolveSuburbFromQuery('Wantirna, VIC')?.name).toBe('Wantirna');
    expect(resolveSuburbFromQuery('Unknownville')).toBeNull();
  });

  it('finds nearest suburb to Melbourne CBD coordinates', () => {
    const nearest = findNearestSuburb(-37.8136, 144.9631);
    expect(nearest?.name).toBe('Melbourne');
  });

  it('includes additional AU/NZ suburbs for office-area coverage', () => {
    expect(resolveSuburbFromQuery('St Leonards, NSW')?.id).toBe('au-nsw-st-leonards');
    expect(resolveSuburbFromQuery('Southbank, VIC')?.id).toBe('au-vic-southbank');
    expect(resolveSuburbFromQuery('Milton, QLD')?.id).toBe('au-qld-milton');
    expect(resolveSuburbFromQuery('West Perth, WA')?.id).toBe('au-wa-west-perth');
    expect(searchSuburbs('east tamaki').some((s) => s.id === 'nz-east-tamaki')).toBe(true);
  });
});
