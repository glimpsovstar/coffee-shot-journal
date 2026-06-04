import { useState } from 'react';
import { isLabelScanAvailable, scanLabelFromBlob } from '../services/labelVision';
import type { BeanDraft } from '../types';

interface LabelScanButtonProps {
  imageBlob: Blob | null;
  onDraft: (draft: BeanDraft, warnings: string[]) => void;
}

export function LabelScanButton({ imageBlob, onDraft }: LabelScanButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const available = isLabelScanAvailable();

  const handleScan = async () => {
    if (!imageBlob) {
      setError('Attach a label photo first.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await scanLabelFromBlob(imageBlob);
      onDraft(result.draft, result.warnings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Label scan failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="label-scan">
      <button
        type="button"
        className="btn-secondary"
        onClick={handleScan}
        disabled={!available || loading || !imageBlob}
      >
        {loading ? 'Scanning…' : 'Scan label'}
      </button>
      {!available && (
        <p className="photo-upload__hint">
          Label scan needs <code>VITE_OPENAI_API_KEY</code> in <code>.env.local</code> (demo
          only — see CONTRIBUTING.md). Enter details manually otherwise.
        </p>
      )}
      {available && !imageBlob && (
        <p className="photo-upload__hint">Attach a photo above to scan the bag label.</p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
