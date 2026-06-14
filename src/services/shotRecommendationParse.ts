import type {
  ShotRecommendationPriority,
  ShotRecommendationResult,
  ShotRecommendationSuggestion,
} from './shotRecommendationTypes.js';
import { SHOT_RECOMMENDATION_DISCLAIMER } from './shotRecommendationTypes.js';

const PRIORITIES: ShotRecommendationPriority[] = ['high', 'medium', 'low'];

export const SHOT_VISION_SYSTEM_PROMPT =
  'You help home baristas dial espresso. Given shot metadata JSON and an optional photo, return JSON only with keys: summary (string), suggestions (array of { area, title, detail, priority: "high"|"medium"|"low" }), warnings (array of strings). Focus on actionable grind/dose/time/milk/bean adjustments. Reference only what you see or what metadata supports. Do not invent grinder models. area examples: visual, crema, milk, grind, dose, time, puck.';

function parsePriority(value: unknown): ShotRecommendationPriority {
  if (typeof value === 'string' && PRIORITIES.includes(value as ShotRecommendationPriority)) {
    return value as ShotRecommendationPriority;
  }
  return 'medium';
}

function parseSuggestion(raw: unknown): ShotRecommendationSuggestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const title = typeof obj.title === 'string' ? obj.title.trim() : '';
  const detail = typeof obj.detail === 'string' ? obj.detail.trim() : '';
  if (!title || !detail) return null;
  const area = typeof obj.area === 'string' && obj.area.trim() ? obj.area.trim() : 'visual';
  return {
    area,
    title,
    detail,
    priority: parsePriority(obj.priority),
  };
}

export function parseShotRecommendationContent(content: string): ShotRecommendationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Shot recommendations returned invalid JSON.');
  }

  const obj = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  const summary =
    typeof obj.summary === 'string' && obj.summary.trim()
      ? obj.summary.trim()
      : 'Visual analysis complete.';

  const suggestions: ShotRecommendationSuggestion[] = [];
  if (Array.isArray(obj.suggestions)) {
    for (const item of obj.suggestions) {
      const suggestion = parseSuggestion(item);
      if (suggestion) suggestions.push(suggestion);
    }
  }

  const warnings: string[] = [];
  if (Array.isArray(obj.warnings)) {
    for (const item of obj.warnings) {
      if (typeof item === 'string' && item.trim()) warnings.push(item.trim());
    }
  }

  return {
    summary,
    suggestions,
    warnings,
    disclaimer: SHOT_RECOMMENDATION_DISCLAIMER,
  };
}

export function mergeRecommendationResults(
  base: ShotRecommendationResult,
  extra: ShotRecommendationResult,
): ShotRecommendationResult {
  const seen = new Set<string>();
  const suggestions: ShotRecommendationSuggestion[] = [];

  for (const item of [...base.suggestions, ...extra.suggestions]) {
    const key = `${item.area}:${item.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    suggestions.push(item);
  }

  const priorityRank: Record<ShotRecommendationPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  suggestions.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  const warnings = [...new Set([...base.warnings, ...extra.warnings])];
  const summary =
    extra.suggestions.length > 0
      ? `${base.summary} Photo analysis added ${extra.suggestions.length} visual hint(s).`
      : base.summary;

  return {
    summary,
    suggestions,
    warnings,
    disclaimer: SHOT_RECOMMENDATION_DISCLAIMER,
  };
}
