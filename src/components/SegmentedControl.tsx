import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  scrollable?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  scrollable = false,
  className = '',
}: SegmentedControlProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<CSSProperties>({ opacity: 0 });

  const measureIndicator = useCallback(() => {
    const track = trackRef.current;
    const active = buttonRefs.current.get(value);
    if (!track || !active) return;

    const trackRect = track.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    setIndicator({
      opacity: 1,
      width: activeRect.width,
      height: activeRect.height,
      transform: `translate(${activeRect.left - trackRect.left}px, ${activeRect.top - trackRect.top}px)`,
    });
  }, [value]);

  useLayoutEffect(() => {
    measureIndicator();
    window.addEventListener('resize', measureIndicator);
    return () => window.removeEventListener('resize', measureIndicator);
  }, [measureIndicator, options.length]);

  return (
    <div className={`segmented-control ${scrollable ? 'segmented-control--scroll' : ''} ${className}`.trim()}>
      {label ? <span className="segmented-control__label">{label}</span> : null}
      <div ref={trackRef} className="segmented-control__track" role="group" aria-label={label}>
        <span className="segmented-control__indicator" style={indicator} aria-hidden="true" />
        {options.map((option) => (
          <button
            key={option.value}
            ref={(node) => {
              if (node) buttonRefs.current.set(option.value, node);
              else buttonRefs.current.delete(option.value);
            }}
            type="button"
            className={
              value === option.value
                ? 'segmented-control__option segmented-control__option--active'
                : 'segmented-control__option'
            }
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
