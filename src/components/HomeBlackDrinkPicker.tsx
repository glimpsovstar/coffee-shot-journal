import type { BlackBeverageType } from '../types';
import { BLACK_BEVERAGES } from '../utils/drinks';

interface HomeBlackDrinkPickerProps {
  beverageType: BlackBeverageType;
  onBeverageTypeChange: (value: BlackBeverageType) => void;
}

export function HomeBlackDrinkPicker({
  beverageType,
  onBeverageTypeChange,
}: HomeBlackDrinkPickerProps) {
  return (
    <fieldset className="cafe-drink-picker home-black-drink-picker">
      <legend className="cafe-drink-picker__legend">What did you drink?</legend>
      <ul className="cafe-drink-picker__menu">
        {BLACK_BEVERAGES.map((item) => (
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
