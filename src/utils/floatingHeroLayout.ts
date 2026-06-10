/** Per-card rotation range (degrees). */
export const HERO_ROTATION_MIN = -20;
export const HERO_ROTATION_MAX = 20;

/** Overlap as a fraction of card width (e.g. 0.25 = 25% overlap). */
export const HERO_OVERLAP_MIN = 0.12;
export const HERO_OVERLAP_MAX = 0.42;

export interface HeroCardLayout {
  /** Stable rotation in degrees (−20 to +20). */
  rotationDeg: number;
  /** Fraction of card width overlapping the previous card (0 for first). */
  overlapFactor: number;
  /** Small vertical shift for a less grid-like stack (% of card height). */
  offsetYPercent: number;
  zIndex: number;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Stable per-card offsets so overlap and tilt feel organic but do not jitter on re-render. */
export function getHeroCardLayout(cardId: string, index: number): HeroCardLayout {
  const hash = hashString(cardId);
  const overlapHash = hashString(`${cardId}:overlap`);

  const rotationSpan = HERO_ROTATION_MAX - HERO_ROTATION_MIN + 1;
  const rotationDeg = HERO_ROTATION_MIN + (hash % rotationSpan);

  const overlapSpan = Math.round((HERO_OVERLAP_MAX - HERO_OVERLAP_MIN) * 100);
  const overlapFactor =
    index === 0
      ? 0
      : HERO_OVERLAP_MIN + (overlapHash % (overlapSpan + 1)) / 100;

  const offsetYPercent = ((hash % 5) - 2) * 2;

  return {
    rotationDeg,
    overlapFactor,
    offsetYPercent,
    zIndex: index + 1,
  };
}
