import { useEffect, useState, type CSSProperties } from 'react';

interface FlavorProfilePickerProps {
  value: string;
  onChange: (value: string) => void;
}

type Axis = 'acidity' | 'body' | 'sweetness';

const AXES: { id: Axis; label: string; low: string; high: string }[] = [
  { id: 'acidity', label: 'Acidity', low: 'soft', high: 'bright' },
  { id: 'body', label: 'Body', low: 'light', high: 'full' },
  { id: 'sweetness', label: 'Sweetness', low: 'dry', high: 'sweet' },
];

function inferAxes(notes: string): Record<Axis, number> {
  const match = notes.match(
    /^acidity:\s*(soft|bright|balanced),?\s*body:\s*(light|full|balanced),?\s*sweetness:\s*(dry|sweet|balanced)/i,
  );
  if (!match) {
    return { acidity: 3, body: 3, sweetness: 3 };
  }

  const wordToLevel = (word: string, low: string, high: string) => {
    const normalized = word.toLowerCase();
    if (normalized === low) return 2;
    if (normalized === high) return 4;
    return 3;
  };

  return {
    acidity: wordToLevel(match[1]!, 'soft', 'bright'),
    body: wordToLevel(match[2]!, 'light', 'full'),
    sweetness: wordToLevel(match[3]!, 'dry', 'sweet'),
  };
}

function buildNotes(axes: Record<Axis, number>, freeform: string): string {
  const summary = AXES.map((axis) => {
    const level = axes[axis.id];
    const word = level <= 2 ? axis.low : level >= 4 ? axis.high : 'balanced';
    return `${axis.label.toLowerCase()}: ${word}`;
  }).join(', ');

  const trimmed = freeform.trim();
  return trimmed ? `${summary}. ${trimmed}` : summary;
}

function stripFlavorSummary(notes: string): string {
  const pattern =
    /acidity:\s*(?:soft|bright|balanced),?\s*body:\s*(?:light|full|balanced),?\s*sweetness:\s*(?:dry|sweet|balanced)\.?\s*/i;
  return notes.replace(pattern, '').trim();
}

export function FlavorProfilePicker({ value, onChange }: FlavorProfilePickerProps) {
  const [axes, setAxes] = useState<Record<Axis, number>>(() => inferAxes(value));
  const [freeform, setFreeform] = useState(() => stripFlavorSummary(value));

  useEffect(() => {
    if (!value.trim()) {
      setAxes({ acidity: 3, body: 3, sweetness: 3 });
      setFreeform('');
    }
  }, [value]);

  const updateAxis = (axis: Axis, level: number) => {
    const next = { ...axes, [axis]: level };
    setAxes(next);
    onChange(buildNotes(next, freeform));
  };

  return (
    <div className="flavor-profile" aria-label="Flavor profile">
      <p className="flavor-profile__title">Flavor dial</p>
      <p className="flavor-profile__hint">Drag each track — notes update as you scrub.</p>
      <div className="flavor-profile__axes">
        {AXES.map((axis) => {
          const level = axes[axis.id];
          const percent = ((level - 1) / 4) * 100;
          return (
            <div key={axis.id} className="flavor-profile__axis">
              <div className="flavor-profile__axis-header">
                <span>{axis.label}</span>
                <span className="flavor-profile__axis-value">{level}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={level}
                className="flavor-profile__range"
                style={{ '--axis-fill': `${percent}%` } as CSSProperties}
                aria-label={`${axis.label} level`}
                onChange={(e) => updateAxis(axis.id, Number(e.target.value))}
              />
            </div>
          );
        })}
      </div>
      <label className="flavor-profile__notes-label" htmlFor="flavor-freeform">
        Extra tasting notes
      </label>
      <textarea
        id="flavor-freeform"
        className="flavor-profile__notes"
        rows={2}
        value={freeform}
        placeholder="Chocolate, jasmine, what to dial next…"
        onChange={(e) => {
          setFreeform(e.target.value);
          onChange(buildNotes(axes, e.target.value));
        }}
      />
    </div>
  );
}
