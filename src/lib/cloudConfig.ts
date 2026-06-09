function readClientEnv(...keys: string[]): string | undefined {
  const env = import.meta.env as Record<string, string | undefined>;
  for (const key of keys) {
    const value = env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

/** Supabase project URL from Vite or Vercel Supabase integration env names. */
export function getSupabaseUrl(): string | undefined {
  return readClientEnv('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
}

/** Publishable key for browser client (never the secret key). */
export function getSupabasePublishableKey(): string | undefined {
  return readClientEnv(
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  );
}

/** Supabase cloud journal is enabled when URL + publishable key are in the build env. */
export function isCloudEnabled(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function getCloudImportDoneKey(userId: string): string {
  return `journal-cloud-import-done:${userId}`;
}

/** User imported local data, skipped the prompt, or imported via backup — do not show banner again. */
export function isCloudImportPromptHandled(userId: string): boolean {
  return localStorage.getItem(getCloudImportDoneKey(userId)) === '1';
}

export function markCloudImportPromptHandled(userId: string): void {
  localStorage.setItem(getCloudImportDoneKey(userId), '1');
}

/** @deprecated Use isCloudImportPromptHandled */
export function isCloudImportMarkedDone(userId: string): boolean {
  return isCloudImportPromptHandled(userId);
}

/** @deprecated Use markCloudImportPromptHandled */
export function markCloudImportDone(userId: string): void {
  markCloudImportPromptHandled(userId);
}
