import { describe, expect, it } from 'vitest';
import { formatAuthErrorMessage } from './authErrors';

describe('formatAuthErrorMessage', () => {
  it('explains generic non-webauthn passkey failures', () => {
    const error = new Error('a Non-Webauthn related error has occurred');
    expect(formatAuthErrorMessage(error)).toMatch(/Continue with Google/);
    expect(formatAuthErrorMessage(error)).toMatch(/coffeesnob\.withdevo\.net/);
  });

  it('surfaces invalid domain cause messages', () => {
    const error = new Error('a Non-Webauthn related error has occurred', {
      cause: new Error('coffeesnob.withdevo.net is an invalid domain'),
    });
    expect(formatAuthErrorMessage(error)).toMatch(/only work on/);
  });

  it('maps credential not found', () => {
    expect(formatAuthErrorMessage(new Error('webauthn_credential_not_found'))).toMatch(
      /No passkey found/,
    );
  });

  it('explains unable to exchange external code', () => {
    expect(
      formatAuthErrorMessage(new Error('Unable to exchange external code: 4/0A')),
    ).toMatch(/same.*Google OAuth client/i);
  });
});
