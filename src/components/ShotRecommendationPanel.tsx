import { useState } from 'react';
import type { Bean, PhotoDisplay, Shot } from '../types';
import { getBeanById } from '../utils/shots';
import {
  fetchShotRecommendations,
  isLocalShotRecommendationDemo,
  isShotRecommendationAvailable,
} from '../services/shotRecommendations';
import type { ShotRecommendationResult } from '../services/shotRecommendationTypes';

interface ShotRecommendationPanelProps {
  shot: Shot;
  beans: Bean[];
  photoItems: PhotoDisplay[];
  photoMetadataCount?: number;
  /** Feed tiles: button + results only, no helper paragraphs. */
  compact?: boolean;
}

async function blobFromPhotoUrl(url: string): Promise<Blob | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    return await response.blob();
  } catch {
    return undefined;
  }
}

export function ShotRecommendationPanel({
  shot,
  beans,
  photoItems,
  photoMetadataCount = 0,
  compact = false,
}: ShotRecommendationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShotRecommendationResult | null>(null);
  const available = isShotRecommendationAvailable();
  const bean = getBeanById(beans, shot.beanId);

  const handleRecommend = async () => {
    setError(null);
    setLoading(true);
    try {
      const firstPhoto = photoItems[0];
      const imageBlob = firstPhoto ? await blobFromPhotoUrl(firstPhoto.url) : undefined;
      const recommendations = await fetchShotRecommendations(shot, bean, imageBlob);
      setResult(recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load recommendations.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`shot-recommendations${compact ? ' shot-recommendations--compact' : ''}`}>
      <button
        type="button"
        className="btn-secondary shot-recommendations__btn"
        onClick={handleRecommend}
        disabled={loading}
      >
        {loading ? 'Analyzing…' : 'Get dial-in suggestions'}
      </button>
      {!compact && !available && (
        <p className="photo-upload__hint">
          Server AI is not configured—heuristic hints only (recipe, bean age, weather, notes).
        </p>
      )}
      {!compact && available && isLocalShotRecommendationDemo() && (
        <p className="photo-upload__hint">
          Local demo: using <code>VITE_OPENAI_API_KEY</code> from <code>.env.local</code>.
        </p>
      )}
      {!compact && photoItems.length === 0 && photoMetadataCount === 0 && (
        <p className="photo-upload__hint">
          Add a shot photo for crema and milk analysis; recipe hints work without a photo.
        </p>
      )}
      {!compact && photoItems.length === 0 && photoMetadataCount > 0 && (
        <p className="photo-upload__hint">
          Photo could not be loaded — try signing out and back in, or re-attach from backup.
        </p>
      )}
      {error ? (
        <p className="form-error" role="alert">{error}</p>
      ) : null}
      {result ? (
        <div className="shot-recommendations__result" aria-live="polite">
          <p className="shot-recommendations__summary">{result.summary}</p>
          {result.warnings.length > 0 ? (
            <ul className="scan-warnings">
              {result.warnings.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          {result.suggestions.length > 0 ? (
            <ul className="shot-recommendations__list">
              {result.suggestions.map((item) => (
                <li
                  key={`${item.area}-${item.title}`}
                  className={`shot-recommendations__item shot-recommendations__item--${item.priority}`}
                >
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="shot-recommendations__disclaimer">{result.disclaimer}</p>
        </div>
      ) : null}
    </div>
  );
}
