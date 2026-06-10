import 'fake-indexeddb/auto';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { seedBeans } from '../data/seed';
import { resetDbForTests } from '../storage/db';
import {
  clearJournalForTests,
  readJournalFromIndexedDb,
} from '../storage/journalRepository';
import type { AddShotPayload } from '../types';
import { useJournal } from './useJournal';

type JournalApi = ReturnType<typeof useJournal>;

function HookHarness({ onUpdate }: { onUpdate: (api: JournalApi) => void }) {
  const journal = useJournal(null);
  onUpdate(journal);
  return null;
}

function shotPayload(tastingNotes: string): AddShotPayload {
  return {
    shot: {
      context: 'home_pulled',
      beanId: seedBeans[0]!.id,
      brewedAt: '2026-06-10T09:00:00.000Z',
      grinder: 'Niche Zero',
      grindSetting: '14',
      doseIn: 18,
      yieldOut: 36,
      extractionTime: 28,
      tastingNotes,
      rating: 4,
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
    const ids = ['shot-a', 'shot-b'];
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => ids.shift() ?? 'shot-extra'),
    });
  });

  it('preserves overlapping shot saves from the same render', async () => {
    let journal: JournalApi | null = null;

    render(<HookHarness onUpdate={(api) => { journal = api; }} />);

    await waitFor(() => expect(journal?.loading).toBe(false));

    const first = journal!.addShot(shotPayload('first overlapping save'));
    const second = journal!.addShot(shotPayload('second overlapping save'));

    await act(async () => {
      await Promise.all([first, second]);
    });

    const stored = await readJournalFromIndexedDb();
    const tastingNotes = stored?.shots.map((shot) => shot.tastingNotes) ?? [];

    expect(tastingNotes).toEqual(
      expect.arrayContaining(['first overlapping save', 'second overlapping save']),
    );
  });
});
