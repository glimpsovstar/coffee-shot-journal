export type ShotRecommendationPriority = 'high' | 'medium' | 'low';

export interface ShotRecommendationSuggestion {
  area: string;
  title: string;
  detail: string;
  priority: ShotRecommendationPriority;
}

export interface ShotRecommendationResult {
  summary: string;
  suggestions: ShotRecommendationSuggestion[];
  warnings: string[];
  disclaimer: string;
}

/** Serializable shot + bean context sent to `/api/shot-recommendations`. */
export interface ShotRecommendationContext {
  beverageType?: string;
  milkCategory?: string;
  grinder?: string;
  grindSetting?: string;
  doseIn?: number;
  yieldOut?: number;
  extractionTime?: number;
  longBlackWaterMl?: number;
  longBlackEspressoMl?: number;
  tastingNotes?: string;
  rating?: number;
  brewedAt?: string;
  weather?: {
    temperatureC: number;
    humidityPercent: number;
    description: string;
  };
  bean?: {
    name: string;
    roaster: string;
    roastStyle: string;
    roastDate: string;
    purchaseDate: string;
    daysSinceRoast?: number;
    daysSincePurchase?: number;
    tastingNotes?: string;
  };
}

export const SHOT_RECOMMENDATION_DISCLAIMER =
  'Suggestions are based on your logged recipe, bean age, weather, and photo analysis. Taste your espresso and adjust gradually—these are hints, not rules.';

export const ANALYTICS_TREND_DISCLAIMER =
  'Suggestions are based on logged extraction trends, bean age, grind settings, and weather when recorded. Taste your espresso and adjust gradually—these are hints, not rules.';
