import { describe, expect, it } from 'vitest';
import { formatUnknownError } from './errors';

describe('formatUnknownError', () => {
  it('reads Error.message', () => {
    expect(formatUnknownError(new Error('boom'), 'fallback')).toBe('boom');
  });

  it('reads Supabase-style error objects', () => {
    expect(formatUnknownError({ message: 'Could not find the table' }, 'fallback')).toBe(
      'Could not find the table',
    );
  });

  it('uses fallback when no message', () => {
    expect(formatUnknownError(null, 'fallback')).toBe('fallback');
  });
});
