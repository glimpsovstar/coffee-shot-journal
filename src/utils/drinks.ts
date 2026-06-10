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
  { id: 'latte', label: 'Latte' },
  { id: 'cappuccino', label: 'Cappuccino' },
  { id: 'flat_white', label: 'Flat white' },
  { id: 'mocha', label: 'Mocha' },
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

export function formatBeverageLabel(type: BeverageType): string {
  const all = [...BLACK_BEVERAGES, ...MILK_BEVERAGES];
  return all.find((b) => b.id === type)?.label ?? type;
}

export function formatShotSizeLabel(size: ShotSize, custom?: string): string {
  if (size === 'custom' && custom?.trim()) return custom.trim();
  return SHOT_SIZES.find((s) => s.id === size)?.label ?? size;
}

export function formatDrinkSummary(shot: Shot): string | undefined {
  if (!shot.milkCategory || !shot.beverageType || !shot.shotSize) return undefined;
  const milk = MILK_CATEGORIES.find((m) => m.id === shot.milkCategory)?.label ?? shot.milkCategory;
  const bev = formatBeverageLabel(shot.beverageType);
  const size = formatShotSizeLabel(shot.shotSize, shot.shotSizeCustom);
  return `${milk} · ${bev} · ${size}`;
}

export function isDrinkSelectionComplete(shot: Pick<Shot, 'milkCategory' | 'beverageType' | 'shotSize' | 'shotSizeCustom'>): boolean {
  if (!shot.milkCategory || !shot.beverageType || !shot.shotSize) return false;
  if (shot.shotSize === 'custom' && !shot.shotSizeCustom?.trim()) return false;
  return true;
}
