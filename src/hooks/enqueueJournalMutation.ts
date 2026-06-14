/** Serializes journal mutations so concurrent writes use latest data. */
export function createJournalMutationQueue() {
  let tail: Promise<void> = Promise.resolve();

  return function enqueueJournalMutation<T>(operation: () => Promise<T>): Promise<T> {
    const run = tail.then(operation, operation);
    tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}
