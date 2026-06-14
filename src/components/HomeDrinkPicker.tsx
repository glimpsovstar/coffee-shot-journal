import type { BeverageType } from '../types';
import { HOME_DRINK_BEVERAGES } from '../utils/drinks';
import { SegmentedControl } from './SegmentedControl';

interface HomeDrinkPickerProps {
  beverageType: BeverageType;
  onBeverageTypeChange: (value: BeverageType) => void;
}

export function HomeDrinkPicker({ beverageType, onBeverageTypeChange }: HomeDrinkPickerProps) {
  return (
    <SegmentedControl
      label="What did you drink?"
      scrollable
      options={HOME_DRINK_BEVERAGES.map((item) => ({ value: item.id, label: item.label }))}
      value={beverageType}
      onChange={onBeverageTypeChange}
      className="home-drink-picker"
    />
  );
}
