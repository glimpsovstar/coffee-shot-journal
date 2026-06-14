import { buildHeuristicRecommendations } from './shotRecommendationHeuristics.js';
import { callOpenAiShotVision } from './shotRecommendationOpenai.js';
import { mergeRecommendationResults } from './shotRecommendationParse.js';
import type { ShotRecommendationContext, ShotRecommendationResult } from './shotRecommendationTypes.js';

export async function buildShotRecommendations(
  apiKey: string,
  context: ShotRecommendationContext,
  image?: { mimeType: string; imageBase64: string },
): Promise<ShotRecommendationResult> {
  const heuristic = buildHeuristicRecommendations(context);

  if (!image?.imageBase64) {
    if (heuristic.suggestions.length === 0) {
      heuristic.warnings.push('Attach a shot photo for visual analysis (crema, milk, puck).');
    }
    return heuristic;
  }

  const vision = await callOpenAiShotVision(
    apiKey,
    context,
    image.mimeType,
    image.imageBase64,
  );

  return mergeRecommendationResults(heuristic, vision);
}
