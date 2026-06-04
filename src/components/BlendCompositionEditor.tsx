import type { BlendComponent } from '../types';
import { createBlendComponent } from '../utils/beans';

interface BlendCompositionEditorProps {
  components: BlendComponent[];
  onChange: (components: BlendComponent[]) => void;
}

export function BlendCompositionEditor({ components, onChange }: BlendCompositionEditorProps) {
  const updateRow = (id: string, patch: Partial<BlendComponent>) => {
    onChange(components.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeRow = (id: string) => {
    onChange(components.filter((c) => c.id !== id));
  };

  return (
    <fieldset className="blend-editor">
      <legend>Blend composition</legend>
      <p className="panel__intro">Components must total 100%.</p>
      <ul className="blend-editor__list">
        {components.map((row, index) => (
          <li key={row.id} className="blend-editor__row">
            <label className="sr-only" htmlFor={`blend-name-${row.id}`}>
              Component {index + 1} name
            </label>
            <input
              id={`blend-name-${row.id}`}
              type="text"
              placeholder="Origin name"
              value={row.name}
              onChange={(e) => updateRow(row.id, { name: e.target.value })}
            />
            <label className="sr-only" htmlFor={`blend-pct-${row.id}`}>
              Percent
            </label>
            <input
              id={`blend-pct-${row.id}`}
              type="number"
              min="1"
              max="100"
              step="1"
              value={row.percent || ''}
              onChange={(e) =>
                updateRow(row.id, { percent: parseFloat(e.target.value) || 0 })
              }
            />
            <span className="blend-editor__suffix">%</span>
            <button
              type="button"
              className="photo-remove"
              onClick={() => removeRow(row.id)}
              disabled={components.length <= 1}
              aria-label={`Remove component ${index + 1}`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => onChange([...components, createBlendComponent()])}
      >
        Add component
      </button>
    </fieldset>
  );
}
