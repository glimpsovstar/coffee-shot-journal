import 'fake-indexeddb/auto';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { seedShots } from '../data/seed';
import { resetDbForTests } from '../storage/db';
import { clearJournalForTests, loadJournal } from '../storage/journalRepository';
import type { NewShot } from '../types';
import { mockShot } from '../test/fixtures';
import { useJournal } from './useJournal';

function makeShot(tastingNotes: string): NewShot {
  return {
    beanId: mockShot.beanId,
    brewedAt: mockShot.brewedAt,
    grinder: mockShot.grinder,
    grindSetting: mockShot.grindSetting,
    doseIn: mockShot.doseIn,
    yieldOut: mockShot.yieldOut,
    extractionTime: mockShot.extractionTime,
    tastingNotes,
    rating: mockShot.rating,
    photos: [],
  };
}

describe('useJournal', () => {
  beforeEach(async () => {
    resetDbForTests();
    await clearJournalForTests();
    resetDbForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preserves overlapping shot writes', async () => {
    const ids = ['new-shot-a', 'new-shot-b'];
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => ids.shift() ?? 'unexpected-shot-id'),
    });

    const { result } = renderHook(() => useJournal());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await Promise.all([
        result.current.addShot({ shot: makeShot('first concurrent shot'), photoBlobs: [] }),
        result.current.addShot({ shot: makeShot('second concurrent shot'), photoBlobs: [] }),
      ]);
    });

    const stored = await loadJournal();
    expect(stored.shots).toHaveLength(seedShots.length + 2);
    expect(stored.shots.map((shot) => shot.tastingNotes)).toEqual(
      expect.arrayContaining(['first concurrent shot', 'second concurrent shot']),
    );
  });
});
