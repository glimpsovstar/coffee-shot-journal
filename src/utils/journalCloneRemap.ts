export function collectPhotoIds(
  beans: { photos?: { id: string }[] }[],
  shots: { photos?: { id: string }[] }[],
  cafes: { photos?: { id: string }[] }[],
): string[] {
  const ids = new Set<string>();
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
export function documentsFromRows<T extends { id: string }>(
  rows: { id: string; document: T }[],
): T[] {
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
export function remapJournalIds<
  TBean extends { id: string },
  TCafe extends { id: string },
  TShot extends { id: string; beanId: string; cafeId?: string },
>(beans: TBean[], shots: TShot[], cafes: TCafe[]) {
  const beanIdMap = new Map<string, string>();
  const cafeIdMap = new Map<string, string>();

  const remappedBeans = beans.map((bean) => {
    const newId = crypto.randomUUID();
    beanIdMap.set(bean.id, newId);
    return { ...structuredClone(bean), id: newId };
  });

  const remappedCafes = cafes.map((cafe) => {
    const newId = crypto.randomUUID();
    cafeIdMap.set(cafe.id, newId);
    return { ...structuredClone(cafe), id: newId };
  });

  const remappedShots = shots.map((shot) => {
    const newId = crypto.randomUUID();
    const next = { ...structuredClone(shot), id: newId };
    if (beanIdMap.has(shot.beanId)) next.beanId = beanIdMap.get(shot.beanId)!;
    if (shot.cafeId && cafeIdMap.has(shot.cafeId)) next.cafeId = cafeIdMap.get(shot.cafeId);
    return next;
  });

  return { beans: remappedBeans, shots: remappedShots, cafes: remappedCafes };
}
