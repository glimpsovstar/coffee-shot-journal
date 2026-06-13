import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AddCafeVisitPayload, Cafe, Shot } from '../types';
import { useJournal } from './useJournal';

const journalRepository = vi.hoisted(() => ({
  deletePhotoBlob: vi.fn(),
  getPhotoBlob: vi.fn(),
  loadJournal: vi.fn(),
  putPhotoBlob: vi.fn(),
  saveBeans: vi.fn(),
  saveCafes: vi.fn(),
  saveShots: vi.fn(),
}));

vi.mock('../storage/journalRepository', () => ({
  ...journalRepository,
}));

vi.mock('../storage/supabaseJournalRepository', () => ({
  deletePhotoBlobFromCloud: vi.fn(),
  getPhotoBlobFromCloud: vi.fn(),
  loadJournalFromCloud: vi.fn(),
  putPhotoBlobToCloud: vi.fn(),
  saveBeansToCloud: vi.fn(),
  saveCafesToCloud: vi.fn(),
  saveShotsToCloud: vi.fn(),
}));

const existingCafe: Cafe = {
  id: 'cafe-existing',
  name: 'Existing Café',
  latitude: -36.85,
  longitude: 174.75,
  notes: '',
  photos: [],
};

const existingShot: Shot = {
  id: 'shot-existing',
  beanId: 'bean-a',
  brewedAt: '2026-06-12T10:00:00.000Z',
  grinder: 'Test Grinder',
  grindSetting: '15',
  doseIn: 18,
  yieldOut: 36,
  extractionTime: 28,
  tastingNotes: 'Existing shot',
  rating: 4,
  photos: [],
};

const visitPayload: AddCafeVisitPayload = {
  cafe: {
    cafe: {
      name: 'New Café',
      latitude: -37.81,
      longitude: 144.96,
      notes: '',
      photos: [],
    },
    photoBlobs: [],
  },
  coffee: {
    shot: {
      context: 'cafe_purchased',
      cafeId: 'pending',
      beanId: '',
      brewedAt: '2026-06-13T09:00:00.000Z',
      milkCategory: 'milk',
      beverageType: 'flat_white',
      shotSize: 'single',
      wouldOrderAgain: true,
      grinder: '',
      grindSetting: '',
      doseIn: 0,
      yieldOut: 0,
      extractionTime: 0,
      tastingNotes: '',
      rating: 4,
      photos: [],
    },
    photoBlobs: [],
  },
};

describe('useJournal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    journalRepository.getPhotoBlob.mockResolvedValue(undefined);
    journalRepository.putPhotoBlob.mockResolvedValue(undefined);
    journalRepository.saveBeans.mockResolvedValue(undefined);
    journalRepository.saveCafes.mockResolvedValue(undefined);
    journalRepository.saveShots.mockResolvedValue(undefined);
    journalRepository.loadJournal.mockResolvedValue({
      beans: [],
      shots: [existingShot],
      cafes: [existingCafe],
    });
  });

  it('does not persist the café when the coffee shot fails to persist', async () => {
    let journal: ReturnType<typeof useJournal> | undefined;
    journalRepository.saveShots.mockRejectedValue(new Error('Shot write failed'));

    function Harness() {
      journal = useJournal(null);
      return null;
    }

    render(<Harness />);

    await waitFor(() => expect(journal?.loading).toBe(false));

    await act(async () => {
      await expect(journal!.addCafeVisit(visitPayload)).rejects.toThrow('Shot write failed');
    });

    expect(journalRepository.saveCafes).not.toHaveBeenCalled();
    expect(journalRepository.saveShots).toHaveBeenCalledTimes(2);
    expect(journalRepository.saveShots).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({ cafeId: expect.any(String), beverageType: 'flat_white' }),
      existingShot,
    ]);
    expect(journalRepository.saveShots).toHaveBeenNthCalledWith(2, [existingShot]);
  });

  it('rolls back the coffee shot when the later café persist fails', async () => {
    let journal: ReturnType<typeof useJournal> | undefined;
    journalRepository.saveCafes
      .mockRejectedValueOnce(new Error('Cafe write failed'))
      .mockResolvedValueOnce(undefined);

    function Harness() {
      journal = useJournal(null);
      return null;
    }

    render(<Harness />);

    await waitFor(() => expect(journal?.loading).toBe(false));

    await act(async () => {
      await expect(journal!.addCafeVisit(visitPayload)).rejects.toThrow('Cafe write failed');
    });

    expect(journalRepository.saveShots).toHaveBeenCalledTimes(2);
    expect(journalRepository.saveShots).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({ cafeId: expect.any(String), beverageType: 'flat_white' }),
      existingShot,
    ]);
    expect(journalRepository.saveShots).toHaveBeenNthCalledWith(2, [existingShot]);
    expect(journalRepository.saveCafes).toHaveBeenCalledTimes(2);
    expect(journalRepository.saveCafes).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({ name: 'New Café' }),
      existingCafe,
    ]);
    expect(journalRepository.saveCafes).toHaveBeenNthCalledWith(2, [existingCafe]);
  });

  it('keeps the coffee shot when the café rollback cannot be confirmed', async () => {
    let journal: ReturnType<typeof useJournal> | undefined;
    journalRepository.saveCafes.mockRejectedValue(new Error('Cafe write failed'));

    function Harness() {
      journal = useJournal(null);
      return null;
    }

    render(<Harness />);

    await waitFor(() => expect(journal?.loading).toBe(false));

    await act(async () => {
      await expect(journal!.addCafeVisit(visitPayload)).rejects.toThrow('Cafe write failed');
    });

    expect(journalRepository.saveCafes).toHaveBeenCalledTimes(2);
    expect(journalRepository.saveShots).toHaveBeenCalledTimes(1);
    expect(journalRepository.saveShots).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({ cafeId: expect.any(String), beverageType: 'flat_white' }),
      existingShot,
    ]);
  });
});
