import 'fake-indexeddb/auto';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDbForTests } from '../storage/db';
import { clearJournalForTests, loadJournal } from '../storage/journalRepository';
import { useJournal } from './useJournal';

function createShotPayload(tastingNotes: string) {
  return {
    shot: {
      beanId: 'bean-ethiopia',
      brewedAt: '2026-06-07T10:00:00.000Z',
      grinder: 'Niche Zero',
      grindSetting: '15',
      doseIn: 18,
      yieldOut: 36,
      extractionTime: 28,
      tastingNotes,
      rating: 4 as const,
      photos: [],
    },
    photoBlobs: [],
  };
}

function createBeanPayload(name: string) {
  return {
    bean: {
      name,
      roaster: 'Test Roasters',
      kind: 'single_origin' as const,
      originOrBlend: 'Test Origin',
      roastStyle: 'medium' as const,
      blendComponents: [],
      roastDate: '2026-06-01',
      purchaseDate: '2026-06-02',
      bagSize: '250g' as const,
      tastingNotes: 'Regression test bean',
      photos: [],
    },
    photoBlobs: [],
  };
}

describe('useJournal', () => {
  beforeEach(async () => {
    resetDbForTests();
    await clearJournalForTests();
    resetDbForTests();
    let idCounter = 0;
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => `test-id-${++idCounter}`),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps both shots when addShot calls overlap from the same render', async () => {
    const { result } = renderHook(() => useJournal());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await Promise.all([
        result.current.addShot(createShotPayload('First overlapping shot')),
        result.current.addShot(createShotPayload('Second overlapping shot')),
      ]);
    });

    const reloaded = await loadJournal();
    expect(reloaded.shots.map((shot) => shot.tastingNotes)).toEqual(
      expect.arrayContaining(['First overlapping shot', 'Second overlapping shot']),
    );
  });

  it('keeps both beans when addBean calls overlap from the same render', async () => {
    const { result } = renderHook(() => useJournal());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await Promise.all([
        result.current.addBean(createBeanPayload('First overlapping bean')),
        result.current.addBean(createBeanPayload('Second overlapping bean')),
      ]);
    });

    const reloaded = await loadJournal();
    expect(reloaded.beans.map((bean) => bean.name)).toEqual(
      expect.arrayContaining(['First overlapping bean', 'Second overlapping bean']),
    );
  });
});
