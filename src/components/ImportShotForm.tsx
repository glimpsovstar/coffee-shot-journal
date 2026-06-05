import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { SuburbEntry } from '../data/auNzSuburbs';
import type { AddShotPayload, Bean, PhotoBlobInput } from '../types';
import { fetchWeatherAt } from '../services/weather';
import { formatBeanChoiceLabel } from '../utils/beans';
import { toDatetimeLocalValue } from '../utils/datetime';
import { createPhotoObjectUrl, revokePhotoObjectUrl } from '../utils/photos';
import { resolveSuburbWithGeocoding } from '../services/geocoding';
import { resolveSuburbFromQuery, searchSuburbs, toStoredSuburb } from '../utils/suburbs';
import { PhotoGalleryEditable } from './PhotoGalleryEditable';
import { PhotoUpload } from './PhotoUpload';
import { StarRating } from './StarRating';
import { SuburbAutocomplete } from './SuburbAutocomplete';
import { UpdateFromPhotoButton, type ShotFormMetadataUpdate } from './UpdateFromPhotoButton';

interface ImportShotFormProps {
  beans: Bean[];
  onImportShot: (payload: AddShotPayload) => Promise<void> | void;
}

interface PendingPhoto extends PhotoBlobInput {
  previewUrl: string;
}

const defaultFormState = (beans: Bean[]) => ({
  beanId: beans[0]?.id ?? '',
  brewedAt: toDatetimeLocalValue(new Date()),
  grinder: '',
  grindSetting: '',
  doseIn: '',
  yieldOut: '',
  extractionTime: '',
  tastingNotes: '',
  rating: 3 as 1 | 2 | 3 | 4 | 5,
  fetchWeather: true,
});

function clearPendingPhotos(pending: PendingPhoto[]) {
  for (const item of pending) {
    revokePhotoObjectUrl(item.previewUrl);
  }
}

function parseOptionalPositive(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = parseFloat(trimmed);
  if (Number.isNaN(n) || n <= 0) return undefined;
  return n;
}

export function ImportShotForm({ beans, onImportShot }: ImportShotFormProps) {
  const [form, setForm] = useState(() => defaultFormState(beans));
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const pendingPhotosRef = useRef(pendingPhotos);
  const [selectedSuburb, setSelectedSuburb] = useState<SuburbEntry | null>(null);
  const [suburbQuery, setSuburbQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    pendingPhotosRef.current = pendingPhotos;
  }, [pendingPhotos]);

  useEffect(() => {
    return () => {
      clearPendingPhotos(pendingPhotosRef.current);
    };
  }, []);

  const handlePhotosAdded = (inputs: PhotoBlobInput[]) => {
    setPendingPhotos((current) => [
      ...current,
      ...inputs.map((input) => ({
        ...input,
        previewUrl: createPhotoObjectUrl(input.blob),
      })),
    ]);
  };

  const handleRemovePending = (photoId: string) => {
    setPendingPhotos((current) => {
      const target = current.find((p) => p.photo.id === photoId);
      if (target) revokePhotoObjectUrl(target.previewUrl);
      return current.filter((p) => p.photo.id !== photoId);
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setStatusMessage(null);

    if (!form.beanId) {
      setError('Please select a bean.');
      return;
    }

    const brewedAt = new Date(form.brewedAt);
    if (Number.isNaN(brewedAt.getTime())) {
      setError('Please enter a valid date and time.');
      return;
    }

    const doseIn = parseOptionalPositive(form.doseIn);
    const yieldOut = parseOptionalPositive(form.yieldOut);
    const extractionTime = parseOptionalPositive(form.extractionTime);

    if (form.doseIn.trim() && doseIn === undefined) {
      setError('Dose must be a positive number if provided.');
      return;
    }
    if (form.yieldOut.trim() && yieldOut === undefined) {
      setError('Yield must be a positive number if provided.');
      return;
    }
    if (form.extractionTime.trim() && extractionTime === undefined) {
      setError('Extraction time must be a positive number if provided.');
      return;
    }

    const trimmedSuburbQuery = suburbQuery.trim();
    const suburbSuggestions = searchSuburbs(trimmedSuburbQuery, 20);
    let resolvedSuburb =
      selectedSuburb ?? (trimmedSuburbQuery ? resolveSuburbFromQuery(trimmedSuburbQuery) : null);

    setSubmitting(true);
    try {
      if (!resolvedSuburb && trimmedSuburbQuery) {
        setStatusMessage('Looking up suburb location…');
        resolvedSuburb = await resolveSuburbWithGeocoding(trimmedSuburbQuery);
      }

      if (trimmedSuburbQuery && !resolvedSuburb) {
        setError(
          suburbSuggestions.length === 0
            ? 'Could not find that suburb — try "Suburb, VIC" format, pick from suggestions, or leave blank.'
            : 'Choose a suburb from the suggestions (click or press Enter).',
        );
        return;
      }

      let weather;
      if (form.fetchWeather && resolvedSuburb) {
        setStatusMessage('Fetching weather for this brew…');
        try {
          weather = await fetchWeatherAt({
            latitude: resolvedSuburb.latitude,
            longitude: resolvedSuburb.longitude,
            at: brewedAt,
          });
        } catch (err) {
          setStatusMessage(
            err instanceof Error
              ? `${err.message} Shot will be saved without weather.`
              : 'Weather unavailable. Shot will be saved without weather.',
          );
        }
      }

      await onImportShot({
        shot: {
          beanId: form.beanId,
          brewedAt: brewedAt.toISOString(),
          ...(resolvedSuburb ? { brewSuburb: toStoredSuburb(resolvedSuburb) } : {}),
          ...(weather ? { weather } : {}),
          grinder: form.grinder.trim(),
          grindSetting: form.grindSetting.trim(),
          doseIn: doseIn ?? 0,
          yieldOut: yieldOut ?? 0,
          extractionTime: extractionTime ?? 0,
          tastingNotes: form.tastingNotes.trim(),
          rating: form.rating,
          photos: pendingPhotos.map((p) => p.photo),
        },
        photoBlobs: pendingPhotos.map(({ photo, blob }) => ({ photo, blob })),
      });

      clearPendingPhotos(pendingPhotos);
      setPendingPhotos([]);
      setSelectedSuburb(null);
      setSuburbQuery('');
      setForm(defaultFormState(beans));
      setStatusMessage('Shot imported.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import shot.');
    } finally {
      setSubmitting(false);
    }
  };

  if (beans.length === 0) {
    return (
      <section className="panel">
        <p className="empty-state">Add beans to the catalogue before importing shots.</p>
      </section>
    );
  }

  const pendingDisplay = pendingPhotos.map(({ photo, previewUrl }) => ({
    photo,
    url: previewUrl,
  }));

  const firstPhotoBlob = pendingPhotos[0]?.blob ?? null;

  const applyMetadataFromPhoto = (patch: ShotFormMetadataUpdate) => {
    setForm((f) => ({
      ...f,
      brewedAt: patch.brewedAt ?? f.brewedAt,
    }));
    if (patch.suburb !== undefined) {
      setSelectedSuburb(patch.suburb);
    }
    if (patch.suburbQuery !== undefined) {
      setSuburbQuery(patch.suburbQuery);
    }
  };

  return (
    <section className="panel" aria-labelledby="import-shot-heading">
      <h2 id="import-shot-heading">Import past shot</h2>
      <p className="panel__intro">
        Backfill shots from memory or old photos. Only bean and date are required — leave recipe
        fields blank if you do not remember them.
      </p>
      <form className="shot-form" onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <label htmlFor="import-beanId">Bean</label>
          <select
            id="import-beanId"
            value={form.beanId}
            onChange={(e) => setForm((f) => ({ ...f, beanId: e.target.value }))}
            required
          >
            {beans.map((bean) => (
              <option key={bean.id} value={bean.id}>
                {formatBeanChoiceLabel(bean)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row form-row--pair">
          <div>
            <label htmlFor="import-brewedAt">Brewed</label>
            <input
              id="import-brewedAt"
              type="datetime-local"
              value={form.brewedAt}
              onChange={(e) => setForm((f) => ({ ...f, brewedAt: e.target.value }))}
              required
            />
          </div>
          <div>
            <SuburbAutocomplete
              id="import-brewSuburb"
              label="Suburb (optional)"
              value={selectedSuburb}
              inputValue={suburbQuery}
              onInputChange={setSuburbQuery}
              onSelect={setSelectedSuburb}
            />
          </div>
        </div>

        <div className="form-row form-row--pair">
          <div>
            <label htmlFor="import-grinder">Grinder (optional)</label>
            <input
              id="import-grinder"
              type="text"
              value={form.grinder}
              onChange={(e) => setForm((f) => ({ ...f, grinder: e.target.value }))}
              placeholder="e.g. Niche Zero"
            />
          </div>
          <div>
            <label htmlFor="import-grindSetting">Grind setting (optional)</label>
            <input
              id="import-grindSetting"
              type="text"
              value={form.grindSetting}
              onChange={(e) => setForm((f) => ({ ...f, grindSetting: e.target.value }))}
              placeholder="e.g. 14.5"
            />
          </div>
        </div>

        <div className="form-row form-row--triple">
          <div>
            <label htmlFor="import-doseIn">Dose in (g, optional)</label>
            <input
              id="import-doseIn"
              type="number"
              min="0.1"
              step="0.1"
              value={form.doseIn}
              onChange={(e) => setForm((f) => ({ ...f, doseIn: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="import-yieldOut">Yield out (g, optional)</label>
            <input
              id="import-yieldOut"
              type="number"
              min="0.1"
              step="0.1"
              value={form.yieldOut}
              onChange={(e) => setForm((f) => ({ ...f, yieldOut: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="import-extractionTime">Time (s, optional)</label>
            <input
              id="import-extractionTime"
              type="number"
              min="1"
              step="1"
              value={form.extractionTime}
              onChange={(e) => setForm((f) => ({ ...f, extractionTime: e.target.value }))}
            />
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="import-tastingNotes">Tasting notes (optional)</label>
          <textarea
            id="import-tastingNotes"
            rows={3}
            value={form.tastingNotes}
            onChange={(e) => setForm((f) => ({ ...f, tastingNotes: e.target.value }))}
          />
        </div>

        <PhotoUpload
          existingCount={pendingPhotos.length}
          onPhotosAdded={handlePhotosAdded}
          label="Shot photos (optional)"
        />
        <PhotoGalleryEditable
          items={pendingDisplay}
          label="Photos to attach"
          onRemove={handleRemovePending}
        />
        <UpdateFromPhotoButton imageBlob={firstPhotoBlob} onUpdate={applyMetadataFromPhoto} />

        <StarRating
          value={form.rating}
          onChange={(rating) => setForm((f) => ({ ...f, rating }))}
          name="import-shot-rating"
          label="Rating"
        />

        <div className="form-row form-row--checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.fetchWeather}
              onChange={(e) => setForm((f) => ({ ...f, fetchWeather: e.target.checked }))}
            />
            Look up weather when suburb is set
          </label>
        </div>

        {statusMessage && (
          <p className="photo-upload__hint" aria-live="polite">
            {statusMessage}
          </p>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Importing…' : 'Import shot'}
        </button>
      </form>
    </section>
  );
}
