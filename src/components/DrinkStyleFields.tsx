import type { BeverageType, MilkCategory, ShotSize } from '../types';
import {
  beveragesForCategory,
  MILK_CATEGORIES,
  SHOT_SIZES,
} from '../utils/drinks';

interface DrinkStyleFieldsProps {
  milkCategory: MilkCategory | '';
  beverageType: BeverageType | '';
  shotSize: ShotSize | '';
  shotSizeCustom: string;
  onMilkCategoryChange: (value: MilkCategory) => void;
  onBeverageTypeChange: (value: BeverageType) => void;
  onShotSizeChange: (value: ShotSize) => void;
  onShotSizeCustomChange: (value: string) => void;
}

export function DrinkStyleFields({
  milkCategory,
  beverageType,
  shotSize,
  shotSizeCustom,
  onMilkCategoryChange,
  onBeverageTypeChange,
  onShotSizeChange,
  onShotSizeCustomChange,
}: DrinkStyleFieldsProps) {
  const beverages = beveragesForCategory(milkCategory || undefined);

  return (
    <fieldset className="drink-style-fields">
      <legend className="drink-style-fields__legend">Drink</legend>

      <div className="form-row">
        <span className="form-label">Milk</span>
        <div className="radio-group">
          {MILK_CATEGORIES.map(({ id, label }) => (
            <label key={id} className="radio-label">
              <input
                type="radio"
                name="milkCategory"
                value={id}
                checked={milkCategory === id}
                onChange={() => {
                  onMilkCategoryChange(id);
                  onBeverageTypeChange('' as BeverageType);
                }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {milkCategory ? (
        <div className="form-row">
          <label htmlFor="beverageType">Beverage</label>
          <select
            id="beverageType"
            value={beverageType}
            onChange={(e) => onBeverageTypeChange(e.target.value as BeverageType)}
            required
          >
            <option value="">Select…</option>
            {beverages.map(({ id, label }) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>
      ) : null}

      {beverageType ? (
        <>
          <div className="form-row">
            <label htmlFor="shotSize">Shot size</label>
            <select
              id="shotSize"
              value={shotSize}
              onChange={(e) => onShotSizeChange(e.target.value as ShotSize)}
              required
            >
              <option value="">Select…</option>
              {SHOT_SIZES.map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
          {shotSize === 'custom' ? (
            <div className="form-row">
              <label htmlFor="shotSizeCustom">Custom size</label>
              <input
                id="shotSizeCustom"
                type="text"
                value={shotSizeCustom}
                onChange={(e) => onShotSizeCustomChange(e.target.value)}
                placeholder="e.g. Triple ristretto"
                required
              />
            </div>
          ) : null}
        </>
      ) : null}
    </fieldset>
  );
}
