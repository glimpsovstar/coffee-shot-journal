import { randomUUID } from 'node:crypto';

export function collectPhotoIds(beans, shots, cafes) {
  const ids = new Set();
  for (const bean of beans) {
    for (const photo of bean.photos ?? []) ids.add(photo.id);
  }
  for (const shot of shots) {
    for (const photo of shot.photos ?? []) ids.add(photo.id);
  }
  for (const cafe of cafes) {
    for (const photo of cafe.photos ?? []) ids.add(photo.id);
  }
  return [...ids];
}

/** Row `id` is the Postgres PK; document.id must match after normalize. */
export function documentsFromRows(rows) {
  return rows.map((row) => {
    const document = structuredClone(row.document);
    if (document.id !== row.id) {
      document.id = row.id;
    }
    return document;
  });
}

/**
 * Postgres PK is global `id` — clone must assign new bean/cafe/shot ids.
 * Photos keep ids; storage paths are per-user.
 */
export function remapJournalIds(beans, shots, cafes) {
  const beanIdMap = new Map();
  const cafeIdMap = new Map();

  const remappedBeans = beans.map((bean) => {
    const newId = randomUUID();
    beanIdMap.set(bean.id, newId);
    return { ...structuredClone(bean), id: newId };
  });

  const remappedCafes = cafes.map((cafe) => {
    const newId = randomUUID();
    cafeIdMap.set(cafe.id, newId);
    return { ...structuredClone(cafe), id: newId };
  });

  const remappedShots = shots.map((shot) => {
    const newId = randomUUID();
    const next = { ...structuredClone(shot), id: newId };
    if (beanIdMap.has(shot.beanId)) next.beanId = beanIdMap.get(shot.beanId);
    if (shot.cafeId && cafeIdMap.has(shot.cafeId)) next.cafeId = cafeIdMap.get(shot.cafeId);
    return next;
  });

  return { beans: remappedBeans, shots: remappedShots, cafes: remappedCafes };
}
