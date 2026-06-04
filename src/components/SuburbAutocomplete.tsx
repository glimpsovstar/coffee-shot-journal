import { useId, useRef, useState } from 'react';
import type { SuburbEntry } from '../data/auNzSuburbs';
import { formatSuburbLabel, searchSuburbs } from '../utils/suburbs';

interface SuburbAutocompleteProps {
  id?: string;
  label?: string;
  value: SuburbEntry | null;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSelect: (suburb: SuburbEntry | null) => void;
}

export function SuburbAutocomplete({
  id: idProp,
  label = 'Suburb',
  value,
  inputValue,
  onInputChange,
  onSelect,
}: SuburbAutocompleteProps) {
  const autoId = useId();
  const inputId = idProp ?? `suburb-${autoId}`;
  const listId = `${inputId}-listbox`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = searchSuburbs(inputValue);

  const selectSuburb = (suburb: SuburbEntry) => {
    onSelect(suburb);
    onInputChange(formatSuburbLabel(suburb));
    setOpen(false);
  };

  const handleBlur = () => {
    blurTimeout.current = setTimeout(() => setOpen(false), 150);
  };

  const handleFocus = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setOpen(true);
    setActiveIndex(0);
  };

  return (
    <div className="suburb-autocomplete">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && suggestions[activeIndex]
            ? `${inputId}-option-${activeIndex}`
            : undefined
        }
        value={inputValue}
        placeholder="Start typing a suburb (Australia or New Zealand)"
        onChange={(e) => {
          onInputChange(e.target.value);
          onSelect(null);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === 'Enter' && suggestions[activeIndex]) {
            e.preventDefault();
            selectSuburb(suggestions[activeIndex]!);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      {value && (
        <p className="photo-upload__hint" aria-live="polite">
          Selected: {formatSuburbLabel(value)}
        </p>
      )}
      {open && suggestions.length > 0 && (
        <ul id={listId} className="suburb-autocomplete__list" role="listbox">
          {suggestions.map((suburb, index) => (
            <li key={suburb.id} role="presentation">
              <button
                type="button"
                id={`${inputId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={
                  index === activeIndex ? 'suburb-autocomplete__option--active' : undefined
                }
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuburb(suburb)}
              >
                {formatSuburbLabel(suburb)}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="photo-upload__hint">Australia and New Zealand suburbs only.</p>
    </div>
  );
}
