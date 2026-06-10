import type { BeverageType, NewShot, Photo, ShotWeather } from '../types';
import { milkCategoryForBeverage, shotSizeFromExtraShot } from './drinks';

export interface CafeCoffeeFields {
  beverageType: BeverageType;
  extraShot: boolean;
  alternativeMilk: boolean;
  beanId: string;
  brewedAtIso: string;
  rating: 1 | 2 | 3 | 4 | 5;
  tastingNotes: string;
  priceAud?: number;
  wouldOrderAgain: boolean;
  weather?: ShotWeather;
  photos: Photo[];
}

export function buildCafeCoffeeShot(cafeId: string, fields: CafeCoffeeFields): NewShot {
  return {
    context: 'cafe_purchased',
    cafeId,
    beanId: fields.beanId || '',
    brewedAt: fields.brewedAtIso,
    milkCategory: milkCategoryForBeverage(fields.beverageType),
    beverageType: fields.beverageType,
    shotSize: shotSizeFromExtraShot(fields.extraShot),
    ...(fields.extraShot ? { extraShot: true } : {}),
    ...(fields.alternativeMilk ? { alternativeMilk: true } : {}),
    ...(fields.weather ? { weather: fields.weather } : {}),
    ...(fields.priceAud !== undefined && !Number.isNaN(fields.priceAud)
      ? { priceAud: fields.priceAud }
      : {}),
    wouldOrderAgain: fields.wouldOrderAgain,
    grinder: '',
    grindSetting: '',
    doseIn: 0,
    yieldOut: 0,
    extractionTime: 0,
    tastingNotes: fields.tastingNotes.trim(),
    rating: fields.rating,
    photos: fields.photos,
  };
}
