/** Supabase cloud journal is enabled when Vite env vars are set (P3). */
export function isCloudEnabled(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return (
    typeof url === 'string' &&
    url.trim().length > 0 &&
    typeof key === 'string' &&
    key.trim().length > 0
  );
}

export function getCloudImportDoneKey(userId: string): string {
  return `journal-cloud-import-done:${userId}`;
}

export function isCloudImportMarkedDone(userId: string): boolean {
  return localStorage.getItem(getCloudImportDoneKey(userId)) === '1';
}

export function markCloudImportDone(userId: string): void {
  localStorage.setItem(getCloudImportDoneKey(userId), '1');
}
