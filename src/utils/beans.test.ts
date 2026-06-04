import { describe, expect, it } from 'vitest';
import {
  createBlendComponent,
  formatRoastStyle,
  normalizeBean,
  originFieldLabel,
  originFieldPlaceholder,
  validateNewBean,
} from './beans';

const baseInput = {
  name: 'Test Bean',
  roaster: 'Roaster',
  kind: 'single_origin' as const,
  originOrBlend: 'Ethiopia',
  roastStyle: 'medium' as const,
  blendComponents: [] as ReturnType<typeof createBlendComponent>[],
  roastDate: '2026-05-01',
  purchaseDate: '2026-05-10',
  bagSize: '250g' as const,
  tastingNotes: 'Notes',
  photos: [],
};

describe('validateNewBean', () => {
  it('accepts valid single origin bean', () => {
    const result = validateNewBean(baseInput);
    expect(result.ok).toBe(true);
  });

  it('requires blend components to sum to 100', () => {
    const result = validateNewBean({
      ...baseInput,
      kind: 'blend',
      originOrBlend: 'House blend',
      blendComponents: [
        createBlendComponent('Brazil', 40),
        createBlendComponent('Colombia', 50),
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/100%/);
    }
  });

  it('accepts valid blend', () => {
    const result = validateNewBean({
      ...baseInput,
      kind: 'blend',
      blendComponents: [
        createBlendComponent('Brazil', 40),
        createBlendComponent('Colombia', 60),
      ],
    });
    expect(result.ok).toBe(true);
  });
});

describe('bean field helpers', () => {
  it('labels and placeholders depend on kind', () => {
    expect(originFieldLabel('single_origin')).toBe('Origin');
    expect(originFieldPlaceholder('single_origin')).toMatch(/Ethiopia/);
    expect(originFieldLabel('blend')).toBe('Blend name');
    expect(formatRoastStyle('dark')).toBe('Dark');
  });
});

describe('normalizeBean', () => {
  it('fills defaults for legacy beans', () => {
    const legacy = {
      id: 'x',
      name: 'Old',
      roaster: 'R',
      originOrBlend: 'Single origin — Test',
      roastDate: '2026-01-01',
      tastingNotes: '',
      photos: [],
    } as unknown as Parameters<typeof normalizeBean>[0];

    const normalized = normalizeBean(legacy);
    expect(normalized.purchaseDate).toBe('2026-01-01');
    expect(normalized.bagSize).toBe('250g');
    expect(normalized.kind).toBe('single_origin');
    expect(normalized.blendComponents).toEqual([]);
    expect(normalized.roastStyle).toBe('medium');
  });
});
