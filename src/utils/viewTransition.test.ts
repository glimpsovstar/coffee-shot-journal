import { describe, expect, it, vi } from 'vitest';
import { startViewTransition } from './viewTransition';

describe('startViewTransition', () => {
  it('runs update immediately when API is unavailable', () => {
    const update = vi.fn();
    startViewTransition(update);
    expect(update).toHaveBeenCalledOnce();
  });

  it('delegates to document.startViewTransition when present', () => {
    const update = vi.fn();
    const startViewTransitionMock = vi.fn((cb: () => void) => cb());
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: startViewTransitionMock,
    });

    startViewTransition(update);

    expect(startViewTransitionMock).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledOnce();

    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: undefined,
    });
  });
});
