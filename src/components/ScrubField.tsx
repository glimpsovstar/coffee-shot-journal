import { useRef, useState, type PointerEvent } from 'react';

interface ScrubFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export function ScrubField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit = '',
}: ScrubFieldProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startValueRef = useRef(0);
  const numeric = parseFloat(value);
  const safeValue = Number.isNaN(numeric) ? min : numeric;
  const span = max - min;
  const percent = span > 0 ? ((safeValue - min) / span) * 100 : 0;

  const clampStep = (next: number) => {
    const stepped = Math.round(next / step) * step;
    const clamped = Math.min(max, Math.max(min, stepped));
    const decimals = String(step).includes('.') ? String(step).split('.')[1]?.length ?? 1 : 0;
    return decimals > 0 ? clamped.toFixed(decimals) : String(clamped);
  };

  const applyDelta = (clientX: number, startX: number, startValue: number) => {
    const track = trackRef.current;
    if (!track) return;
    const width = track.getBoundingClientRect().width || 1;
    const deltaRatio = (clientX - startX) / width;
    const deltaValue = deltaRatio * span;
    onChange(clampStep(startValue + deltaValue));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    startXRef.current = event.clientX;
    startValueRef.current = safeValue;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    applyDelta(event.clientX, startXRef.current, startValueRef.current);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="scrub-field">
      <div className="scrub-field__header">
        <label htmlFor={id}>{label}</label>
        <output className="scrub-field__value" htmlFor={id}>
          {safeValue}{unit}
        </output>
      </div>
      <div
        ref={trackRef}
        className={`scrub-field__track${isDragging ? ' scrub-field__track--active' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={safeValue}
        aria-label={label}
      >
        <span className="scrub-field__fill" style={{ width: `${percent}%` }} />
        <span className="scrub-field__thumb" style={{ left: `${percent}%` }} />
      </div>
      <input id={id} type="hidden" value={value} readOnly />
    </div>
  );
}
