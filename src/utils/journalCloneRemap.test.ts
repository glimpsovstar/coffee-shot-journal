import { describe, expect, it } from 'vitest';
import {
  collectPhotoIds,
  documentsFromRows,
  remapJournalIds,
} from './journalCloneRemap';

describe('journalCloneRemap', () => {
  it('normalizes document id to match row id', () => {
    const docs = documentsFromRows([
      { id: 'row-id', document: { id: 'stale-doc-id', name: 'Bean' } },
    ]);
    expect(docs[0].id).toBe('row-id');
  });

  it('remaps entity ids and shot foreign keys', () => {
    const beans = [{ id: 'b1', photos: [] }];
    const cafes = [{ id: 'c1', photos: [] }];
    const shots = [{ id: 's1', beanId: 'b1', cafeId: 'c1', photos: [] }];

    const remapped = remapJournalIds(beans, shots, cafes);

    expect(remapped.beans[0].id).not.toBe('b1');
    expect(remapped.cafes[0].id).not.toBe('c1');
    expect(remapped.shots[0].id).not.toBe('s1');
    expect(remapped.shots[0].beanId).toBe(remapped.beans[0].id);
    expect(remapped.shots[0].cafeId).toBe(remapped.cafes[0].id);
  });

  it('collects photo ids from all entities', () => {
    const ids = collectPhotoIds(
      [{ photos: [{ id: 'p1' }] }],
      [{ photos: [{ id: 'p2' }] }],
      [{ photos: [{ id: 'p3' }] }],
    );
    expect(ids).toEqual(['p1', 'p2', 'p3']);
  });
});
