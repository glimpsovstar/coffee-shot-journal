import { describe, expect, it } from 'vitest';
import { TEST_LOGIN_PATH, isTestLoginPath } from './testLoginPath';

describe('isTestLoginPath', () => {
  it('matches the test login path', () => {
    expect(isTestLoginPath(TEST_LOGIN_PATH)).toBe(true);
    expect(isTestLoginPath(`${TEST_LOGIN_PATH}/`)).toBe(true);
  });

  it('does not match other paths', () => {
    expect(isTestLoginPath('/')).toBe(false);
    expect(isTestLoginPath('/journal')).toBe(false);
  });
});
