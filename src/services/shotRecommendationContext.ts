import type { Bean, Shot } from '../types/index.js';
import type { ShotRecommendationContext } from './shotRecommendationTypes.js';

function daysBetween(startIso: string, endIso: string): number | undefined {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
  return Math.floor((end.getTime() - start.getTime()) / 86400000);
}

export function buildShotRecommendationContext(
  shot: Shot,
  bean: Bean | undefined,
): ShotRecommendationContext {
  const context: ShotRecommendationContext = {
    beverageType: shot.beverageType,
    milkCategory: shot.milkCategory,
    grinder: shot.grinder,
    grindSetting: shot.grindSetting,
    doseIn: shot.doseIn,
    yieldOut: shot.yieldOut,
    extractionTime: shot.extractionTime,
    longBlackWaterMl: shot.longBlackWaterMl,
    longBlackEspressoMl: shot.longBlackEspressoMl,
    tastingNotes: shot.tastingNotes,
    rating: shot.rating,
    brewedAt: shot.brewedAt,
    weather: shot.weather
      ? {
          temperatureC: shot.weather.temperatureC,
          humidityPercent: shot.weather.humidityPercent,
          description: shot.weather.description,
        }
      : undefined,
  };

  if (bean) {
    const daysSinceRoast = daysBetween(bean.roastDate + 'T12:00:00', shot.brewedAt);
    const daysSincePurchase = daysBetween(bean.purchaseDate + 'T12:00:00', shot.brewedAt);
    context.bean = {
      name: bean.name,
      roaster: bean.roaster,
      roastStyle: bean.roastStyle,
      roastDate: bean.roastDate,
      purchaseDate: bean.purchaseDate,
      daysSinceRoast,
      daysSincePurchase,
      tastingNotes: bean.tastingNotes,
    };
  }

  return context;
}
