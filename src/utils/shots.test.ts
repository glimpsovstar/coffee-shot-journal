import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockBeans } from '../test/fixtures';
import {
  formatBrewedAt,
  formatRoastDate,
  getBeanById,
  hasShotGrinder,
  hasShotRecipe,
  ratio,
  sortShotsNewestFirst,
} from './shots';
import type { Shot } from '../types';

describe('getBeanById', () => {
  it('returns the bean when id matches', () => {
    expect(getBeanById(mockBeans, 'bean-a')?.name).toBe('Test Ethiopia');
  });

  it('returns undefined when id is missing', () => {
    expect(getBeanById(mockBeans, 'missing')).toBeUndefined();
  });
});

describe('ratio', () => {
  it('formats dose to yield ratio', () => {
    expect(ratio(18, 36)).toBe('1:2.0');
  });

  it('returns em dash when dose is zero or negative', () => {
    expect(ratio(0, 36)).toBe('—');
    expect(ratio(-1, 36)).toBe('—');
  });
});

describe('sortShotsNewestFirst', () => {
  it('sorts by brewedAt descending without mutating input', () => {
    const shots = [
      { id: 'old', brewedAt: '2026-06-01T08:00:00' },
      { id: 'new', brewedAt: '2026-06-04T14:00:00' },
      { id: 'mid', brewedAt: '2026-06-02T12:00:00' },
    ];

    const sorted = sortShotsNewestFirst(shots);

    expect(sorted.map((s) => s.id)).toEqual(['new', 'mid', 'old']);
    expect(shots.map((s) => s.id)).toEqual(['old', 'new', 'mid']);
  });
});

describe('formatBrewedAt', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses locale string formatting', () => {
    vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('Jun 4, 2026, 10:00 AM');

    expect(formatBrewedAt('2026-06-04T10:00:00')).toBe('Jun 4, 2026, 10:00 AM');
    expect(Date.prototype.toLocaleString).toHaveBeenCalledWith(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  });
});

describe('partial shot display helpers', () => {
  const fullShot: Shot = {
    id: 's1',
    beanId: 'b1',
    brewedAt: '2026-06-01T08:00:00',
    grinder: 'Niche',
    grindSetting: '14',
    doseIn: 18,
    yieldOut: 36,
    extractionTime: 28,
    tastingNotes: '',
    rating: 4,
    photos: [],
  };

  it('detects missing recipe and grinder on imported shots', () => {
    const imported = { ...fullShot, doseIn: 0, yieldOut: 0, extractionTime: 0, grinder: '', grindSetting: '' };
    expect(hasShotRecipe(imported)).toBe(false);
    expect(hasShotGrinder(imported)).toBe(false);
    expect(hasShotRecipe(fullShot)).toBe(true);
  });
});

describe('formatRoastDate', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses locale date formatting at noon UTC offset', () => {
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('May 1, 2026');

    expect(formatRoastDate('2026-05-01')).toBe('May 1, 2026');
    expect(Date.prototype.toLocaleDateString).toHaveBeenCalledWith(undefined, {
      dateStyle: 'medium',
    });
  });
});
