import { useState } from 'react';
import type { SuburbEntry } from '../data/auNzSuburbs';
import { toDatetimeLocalValue } from '../utils/datetime';
import { extractShotMetadataFromBlob } from '../utils/photoExif';
import { findNearestSuburb, formatSuburbLabel } from '../utils/suburbs';

export interface ShotFormMetadataUpdate {
  brewedAt?: string;
  suburb?: SuburbEntry | null;
  suburbQuery?: string;
}

interface UpdateFromPhotoButtonProps {
  imageBlob: Blob | null;
  onUpdate: (patch: ShotFormMetadataUpdate, messages: string[]) => void;
}

export function UpdateFromPhotoButton({ imageBlob, onUpdate }: UpdateFromPhotoButtonProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!imageBlob) {
      setError('Attach a shot photo first.');
      setFeedback([]);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const { brewedAt, gps, messages } = await extractShotMetadataFromBlob(imageBlob);
      const patch: ShotFormMetadataUpdate = {};

      if (brewedAt) {
        patch.brewedAt = toDatetimeLocalValue(brewedAt);
      }
      if (gps) {
        const nearest = findNearestSuburb(gps.latitude, gps.longitude);
        if (nearest) {
          patch.suburb = nearest;
          patch.suburbQuery = formatSuburbLabel(nearest);
        } else {
          messages.push('GPS is outside the AU/NZ suburb list — search manually.');
        }
      }

      onUpdate(patch, messages);
      setFeedback(messages);
    } catch {
      setError('Could not read photo metadata.');
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="photo-metadata-update">
      <button
        type="button"
        className="btn-secondary"
        onClick={handleUpdate}
        disabled={loading || !imageBlob}
      >
        {loading ? 'Reading photo…' : 'Update from photo'}
      </button>
      {!imageBlob && (
        <p className="photo-upload__hint">
          Attach a photo above, then update brewed time and location from its metadata.
        </p>
      )}
      {feedback.length > 0 && (
        <ul className="scan-warnings" aria-live="polite">
          {feedback.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
