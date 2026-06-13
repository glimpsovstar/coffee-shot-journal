import type {
  BeverageType,
  BlackBeverageType,
  MilkBeverageType,
  MilkCategory,
  Shot,
  ShotSize,
} from '../types';

export const MILK_CATEGORIES: { id: MilkCategory; label: string }[] = [
  { id: 'black', label: 'Black' },
  { id: 'milk', label: 'Milk-based' },
];

export const BLACK_BEVERAGES: { id: BlackBeverageType; label: string }[] = [
  { id: 'espresso', label: 'Espresso' },
  { id: 'ristretto', label: 'Ristretto' },
  { id: 'long_black', label: 'Long black' },
];

export const MILK_BEVERAGES: { id: MilkBeverageType; label: string }[] = [
  { id: 'flat_white', label: 'Flat white' },
  { id: 'latte', label: 'Latte' },
  { id: 'cappuccino', label: 'Cappuccino' },
  { id: 'mocha', label: 'Mocha' },
  { id: 'magic', label: 'Magic' },
];

/** Flat café menu — milk drinks first, then black. */
export const CAFE_MENU_BEVERAGES: { id: BeverageType; label: string; category: MilkCategory }[] = [
  ...MILK_BEVERAGES.map((item) => ({ ...item, category: 'milk' as MilkCategory })),
  ...BLACK_BEVERAGES.map((item) => ({ ...item, category: 'black' as MilkCategory })),
];

export const SHOT_SIZES: { id: ShotSize; label: string }[] = [
  { id: 'half', label: 'Half shot' },
  { id: 'single', label: 'Single' },
  { id: 'double', label: 'Double' },
  { id: 'custom', label: 'Custom' },
];

export function beveragesForCategory(category: MilkCategory | undefined) {
  if (category === 'black') return BLACK_BEVERAGES;
  if (category === 'milk') return MILK_BEVERAGES;
  return [];
}

export function milkCategoryForBeverage(type: BeverageType): MilkCategory {
  const menu = CAFE_MENU_BEVERAGES.find((item) => item.id === type);
  if (menu) return menu.category;
  if (BLACK_BEVERAGES.some((item) => item.id === type)) return 'black';
  return 'milk';
}

export function isMilkBasedBeverage(type: BeverageType): boolean {
  return milkCategoryForBeverage(type) === 'milk';
}

export function shotSizeFromExtraShot(extraShot: boolean): ShotSize {
  return extraShot ? 'double' : 'single';
}

export function formatBeverageLabel(type: BeverageType): string {
  const all = [...BLACK_BEVERAGES, ...MILK_BEVERAGES];
  return all.find((b) => b.id === type)?.label ?? type;
}

export function formatShotSizeLabel(size: ShotSize, custom?: string): string {
  if (size === 'custom' && custom?.trim()) return custom.trim();
  return SHOT_SIZES.find((s) => s.id === size)?.label ?? size;
}

export function formatDrinkSummary(shot: Shot): string | undefined {
  if (!shot.beverageType) return undefined;

  const parts: string[] = [formatBeverageLabel(shot.beverageType)];

  const extraShot = shot.extraShot ?? shot.shotSize === 'double';
  if (extraShot) parts.push('extra shot');

  if (shot.alternativeMilk) parts.push('alt milk');

  if (
    shot.beverageType === 'long_black' &&
    shot.longBlackWaterMl !== undefined &&
    shot.longBlackEspressoMl !== undefined
  ) {
    parts.push(`${shot.longBlackWaterMl}ml water · ${shot.longBlackEspressoMl}ml espresso`);
  }

  if (
    shot.shotSize &&
    shot.shotSize !== 'single' &&
    shot.shotSize !== 'double' &&
    shot.shotSize !== 'custom'
  ) {
    parts.push(formatShotSizeLabel(shot.shotSize, shot.shotSizeCustom));
  } else if (shot.shotSize === 'custom' && shot.shotSizeCustom?.trim()) {
    parts.push(shot.shotSizeCustom.trim());
  }

  return parts.join(' · ');
}

export function isDrinkSelectionComplete(
  shot: Pick<Shot, 'milkCategory' | 'beverageType' | 'shotSize' | 'shotSizeCustom'>,
): boolean {
  if (!shot.milkCategory || !shot.beverageType || !shot.shotSize) return false;
  if (shot.shotSize === 'custom' && !shot.shotSizeCustom?.trim()) return false;
  return true;
}

export function isCafeDrinkComplete(beverageType: BeverageType | ''): boolean {
  return Boolean(beverageType);
}
