import { describe, expect, it } from 'vitest';
import { isCafesTableMissingError } from './supabaseJournalRepository';

describe('isCafesTableMissingError', () => {
  it('detects missing cafes table errors', () => {
    expect(
      isCafesTableMissingError({
        message: "Could not find the table 'public.cafes' in the schema cache",
        code: 'PGRST205',
      }),
    ).toBe(true);
    expect(
      isCafesTableMissingError({
        message: 'relation "public.cafes" does not exist',
      }),
    ).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isCafesTableMissingError({ message: 'JWT expired' })).toBe(false);
  });
});
