import type { BeverageType } from '../types';
import { HOME_DRINK_BEVERAGES } from '../utils/drinks';

interface HomeDrinkPickerProps {
  beverageType: BeverageType;
  onBeverageTypeChange: (value: BeverageType) => void;
}

export function HomeDrinkPicker({ beverageType, onBeverageTypeChange }: HomeDrinkPickerProps) {
  return (
    <fieldset className="cafe-drink-picker home-drink-picker">
      <legend className="cafe-drink-picker__legend">What did you drink?</legend>
      <ul className="cafe-drink-picker__menu">
        {HOME_DRINK_BEVERAGES.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={
                beverageType === item.id
                  ? 'cafe-drink-picker__option cafe-drink-picker__option--active'
                  : 'cafe-drink-picker__option'
              }
              aria-pressed={beverageType === item.id}
              onClick={() => onBeverageTypeChange(item.id)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
