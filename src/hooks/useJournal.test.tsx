import 'fake-indexeddb/auto';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { seedShots } from '../data/seed';
import { resetDbForTests } from '../storage/db';
import { clearJournalForTests, loadJournal } from '../storage/journalRepository';
import type { NewShot } from '../types';
import { useJournal } from './useJournal';

function buildShot(overrides: Partial<NewShot> = {}): NewShot {
  return {
    beanId: 'bean-ethiopia',
    brewedAt: '2026-06-05T12:00:00.000Z',
    grinder: 'Test grinder',
    grindSetting: '15',
    doseIn: 18,
    yieldOut: 36,
    extractionTime: 28,
    tastingNotes: 'Concurrent save',
    rating: 4,
    photos: [],
    ...overrides,
  };
}

describe('useJournal', () => {
  beforeEach(async () => {
    vi.unstubAllGlobals();
    resetDbForTests();
    await clearJournalForTests();
    resetDbForTests();
  });

  it('persists overlapping shot additions without dropping either shot', async () => {
    const ids = ['shot-concurrent-a', 'shot-concurrent-b'];
    vi.stubGlobal('crypto', {
      randomUUID: () => ids.shift() ?? 'unexpected-shot-id',
    });

    const { result } = renderHook(() => useJournal());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const firstSave = result.current.addShot({
      shot: buildShot({ tastingNotes: 'First concurrent shot' }),
      photoBlobs: [],
    });
    const secondSave = result.current.addShot({
      shot: buildShot({ tastingNotes: 'Second concurrent shot' }),
      photoBlobs: [],
    });

    await Promise.all([firstSave, secondSave]);

    const reloaded = await loadJournal();
    expect(reloaded.shots).toHaveLength(seedShots.length + 2);
    expect(reloaded.shots.map((shot) => shot.id)).toEqual(
      expect.arrayContaining(['shot-concurrent-a', 'shot-concurrent-b']),
    );
  });
});
