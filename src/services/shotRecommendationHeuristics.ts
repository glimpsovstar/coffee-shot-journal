import type {
  ShotRecommendationContext,
  ShotRecommendationResult,
  ShotRecommendationSuggestion,
} from './shotRecommendationTypes.js';
import { SHOT_RECOMMENDATION_DISCLAIMER } from './shotRecommendationTypes.js';

function ratio(doseIn: number, yieldOut: number): number | undefined {
  if (doseIn <= 0 || yieldOut <= 0) return undefined;
  return yieldOut / doseIn;
}

function isEspressoStyle(context: ShotRecommendationContext): boolean {
  const type = context.beverageType ?? 'espresso';
  return type !== 'long_black';
}

export function buildHeuristicRecommendations(
  context: ShotRecommendationContext,
): ShotRecommendationResult {
  const suggestions: ShotRecommendationSuggestion[] = [];
  const warnings: string[] = [];

  const dose = context.doseIn ?? 0;
  const yieldOut = context.yieldOut ?? 0;
  const time = context.extractionTime ?? 0;
  const rating = context.rating;

  if (isEspressoStyle(context) && dose > 0 && yieldOut > 0) {
    const r = ratio(dose, yieldOut);
    if (r !== undefined) {
      if (r < 1.6) {
        suggestions.push({
          area: 'yield',
          title: 'Low yield ratio',
          detail:
            `Your ratio is about 1:${r.toFixed(1)} (${dose}g → ${yieldOut}g). Shots often taste sour or thin when yield is low. Try a finer grind, slightly higher dose, or pull a few seconds longer before stopping.`,
          priority: 'medium',
        });
      } else if (r > 2.4) {
        suggestions.push({
          area: 'yield',
          title: 'High yield ratio',
          detail:
            `Your ratio is about 1:${r.toFixed(1)}. Higher yields can taste bitter or hollow. Try a coarser grind, slightly lower dose, or stop the shot earlier.`,
          priority: 'medium',
        });
      }
    }
  }

  if (time > 0 && isEspressoStyle(context)) {
    if (time < 22) {
      suggestions.push({
        area: 'time',
        title: 'Fast extraction',
        detail: `${time}s is quick for espresso. If it tastes sour or sharp, grind finer or increase dose slightly. If it already tastes balanced, your grinder may be very efficient on this setting.`,
        priority: rating !== undefined && rating <= 2 ? 'high' : 'medium',
      });
    } else if (time > 36) {
      suggestions.push({
        area: 'time',
        title: 'Slow extraction',
        detail: `${time}s is long for espresso. If it tastes bitter or ashy, grind coarser or reduce dose. Channeling can also extend time—check prep and distribution.`,
        priority: rating !== undefined && rating <= 2 ? 'high' : 'medium',
      });
    }
  }

  const bean = context.bean;
  if (bean?.daysSinceRoast !== undefined) {
    const days = bean.daysSinceRoast;
    if (days < 4) {
      suggestions.push({
        area: 'bean_age',
        title: 'Very fresh coffee',
        detail: `Roasted ${days} day(s) before this pull. Fresh beans can be gassy and hard to dial. If shots are wild or inconsistent, let the bag rest a few more days with the valve closed.`,
        priority: 'medium',
      });
    } else if (days > 45) {
      suggestions.push({
        area: 'bean_age',
        title: 'Older roast',
        detail: `About ${days} days off roast. Flavour may be flat or stale. Use a slightly finer grind and fresher beans if you notice cardboard or muted acidity.`,
        priority: 'high',
      });
    } else if (days > 28) {
      suggestions.push({
        area: 'bean_age',
        title: 'Aging beans',
        detail: `About ${days} days off roast. Peak window may be passing—note if acidity drops or the cup tastes dry.`,
        priority: 'low',
      });
    }
  }

  const humidity = context.weather?.humidityPercent;
  if (humidity !== undefined) {
    if (humidity > 75) {
      suggestions.push({
        area: 'weather',
        title: 'High humidity',
        detail: `Humidity was ${humidity}% when you pulled. Moist air can make grounds clump and resist flow. Wipe the chute, tap the portafilter, and expect to grind slightly coarser than on dry days.`,
        priority: 'low',
      });
    } else if (humidity < 25) {
      suggestions.push({
        area: 'weather',
        title: 'Low humidity',
        detail: `Humidity was ${humidity}%—very dry air increases static and retention in the grinder. A quick wipe of the chute and consistent dosing help avoid uneven shots.`,
        priority: 'low',
      });
    }
  }

  if (context.tastingNotes?.trim()) {
    const notes = context.tastingNotes.toLowerCase();
    if (notes.includes('sour') || notes.includes('sharp') || notes.includes('under')) {
      suggestions.push({
        area: 'tasting',
        title: 'Under-extraction cues in your notes',
        detail:
          'Your tasting notes mention sour or sharp flavours—often linked to under-extraction. Consider finer grind, higher dose, or slightly longer time before changing beans.',
        priority: 'medium',
      });
    }
    if (notes.includes('bitter') || notes.includes('ashy') || notes.includes('over')) {
      suggestions.push({
        area: 'tasting',
        title: 'Over-extraction cues in your notes',
        detail:
          'Your notes mention bitter or ashy flavours—often linked to over-extraction. Try coarser grind, lower dose, or stop the shot earlier.',
        priority: 'medium',
      });
    }
  }

  const summary =
    suggestions.length > 0
      ? `Found ${suggestions.length} adjustment hint(s) from your recipe, bean age, weather, and notes.`
      : 'No strong heuristic flags from recipe and context—add a photo for visual analysis or keep logging pulls to spot trends.';

  return {
    summary,
    suggestions,
    warnings,
    disclaimer: SHOT_RECOMMENDATION_DISCLAIMER,
  };
}
