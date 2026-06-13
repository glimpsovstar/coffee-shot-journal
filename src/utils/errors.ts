/** Readable message from thrown values (Supabase Postgrest errors are not `Error` instances). */
export function formatUnknownError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
}
