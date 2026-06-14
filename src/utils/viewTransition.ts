type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => void;
};

/** Wraps DOM updates in the View Transitions API when supported. */
export function startViewTransition(update: () => void): void {
  const doc = document as ViewTransitionDocument;
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(() => {
      update();
    });
    return;
  }
  update();
}
