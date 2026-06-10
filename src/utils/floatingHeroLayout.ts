/** Horizontal shift options for hero cards (percent of card width). */
export const HERO_OFFSET_X_OPTIONS = [-20, 0, 20] as const;

export interface HeroCardLayout {
  /** translateX as % of the card's own width (−20, 0, or +20). */
  offsetXPercent: number;
  /** Small vertical shift for a less grid-like stack. */
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

/** Stable per-card offsets so overlap and drift feel organic but do not jitter on re-render. */
export function getHeroCardLayout(cardId: string, index: number): HeroCardLayout {
  const hash = hashString(cardId);
  const offsetXPercent = HERO_OFFSET_X_OPTIONS[hash % HERO_OFFSET_X_OPTIONS.length];
  const offsetYPercent = ((hash % 5) - 2) * 3;

  return {
    offsetXPercent,
    offsetYPercent,
    zIndex: index + 1,
  };
}
