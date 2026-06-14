/** Temporary beta-tester sign-in (email/password). See issue #61. */
export const TEST_LOGIN_PATH = '/test-login';

export function isTestLoginPath(pathname = window.location.pathname): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === TEST_LOGIN_PATH;
}
