import type { BeverageType } from '../types';
import { CAFE_MENU_BEVERAGES, isMilkBasedBeverage } from '../utils/drinks';

interface CafeDrinkPickerProps {
  beverageType: BeverageType | '';
  extraShot: boolean;
  alternativeMilk: boolean;
  onBeverageTypeChange: (value: BeverageType) => void;
  onExtraShotChange: (value: boolean) => void;
  onAlternativeMilkChange: (value: boolean) => void;
}

export function CafeDrinkPicker({
  beverageType,
  extraShot,
  alternativeMilk,
  onBeverageTypeChange,
  onExtraShotChange,
  onAlternativeMilkChange,
}: CafeDrinkPickerProps) {
  const showAltMilk = beverageType && isMilkBasedBeverage(beverageType);

  return (
    <fieldset className="cafe-drink-picker">
      <legend className="cafe-drink-picker__legend">Coffee</legend>
      <ul className="cafe-drink-picker__menu">
        {CAFE_MENU_BEVERAGES.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={
                beverageType === item.id
                  ? 'cafe-drink-picker__option cafe-drink-picker__option--active'
                  : 'cafe-drink-picker__option'
              }
              aria-pressed={beverageType === item.id}
              onClick={() => {
                onBeverageTypeChange(item.id);
                if (!isMilkBasedBeverage(item.id)) {
                  onAlternativeMilkChange(false);
                }
              }}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      {beverageType ? (
        <div className="cafe-drink-picker__options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={extraShot}
              onChange={(e) => onExtraShotChange(e.target.checked)}
            />
            Extra shot / strong
          </label>
          {showAltMilk ? (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={alternativeMilk}
                onChange={(e) => onAlternativeMilkChange(e.target.checked)}
              />
              Alternative milk
            </label>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );
}
