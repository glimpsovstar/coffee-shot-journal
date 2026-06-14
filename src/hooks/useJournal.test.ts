import 'fake-indexeddb/auto';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { mockBeans } from '../test/fixtures';
import { clearJournalForTests, saveBeans, saveCafes, saveShots } from '../storage/journalRepository';
import { resetDbForTests } from '../storage/db';
import { useJournal } from './useJournal';

describe('useJournal', () => {
  beforeEach(async () => {
    resetDbForTests();
    await clearJournalForTests();
    resetDbForTests();
    await saveBeans(mockBeans);
    await saveShots([]);
    await saveCafes([]);
  });

  it('retains both shots when addShot is called concurrently', async () => {
    const { result } = renderHook(() => useJournal(null));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const baseShot = {
      context: 'home_pulled' as const,
      beanId: 'bean-a',
      milkCategory: 'black' as const,
      beverageType: 'espresso' as const,
      brewedAt: '2026-06-04T09:00:00.000Z',
      grinder: 'Test',
      grindSetting: '14',
      doseIn: 18,
      yieldOut: 36,
      extractionTime: 28,
      tastingNotes: '',
      rating: 4 as const,
      photos: [],
    };

    await Promise.all([
      result.current.addShot({ shot: baseShot, photoBlobs: [] }),
      result.current.addShot({
        shot: { ...baseShot, tastingNotes: 'Second' },
        photoBlobs: [],
      }),
    ]);

    await waitFor(() => expect(result.current.shots).toHaveLength(2));
    expect(result.current.shots.some((s) => s.tastingNotes === 'Second')).toBe(true);
  });
});
