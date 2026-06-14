import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { SuburbEntry } from '../data/auNzSuburbs';
import type { AddShotPayload, Bean, BeverageType, PhotoBlobInput } from '../types';
import { milkCategoryForBeverage } from '../utils/drinks';
import { formatUnknownError } from '../utils/errors';
import { fetchWeatherAt } from '../services/weather';
import { formatBeanChoiceLabel } from '../utils/beans';
import { toDatetimeLocalValue } from '../utils/datetime';
import { createPhotoObjectUrl, metadataBlobForPhoto, revokePhotoObjectUrl } from '../utils/photos';
import { resolveSuburbWithGeocoding } from '../services/geocoding';
import { resolveSuburbFromQuery, searchSuburbs, toStoredSuburb } from '../utils/suburbs';
import { PhotoGalleryEditable } from './PhotoGalleryEditable';
import { PhotoUpload } from './PhotoUpload';
import { StarRating } from './StarRating';
import { SuburbAutocomplete } from './SuburbAutocomplete';
import { UpdateFromPhotoButton, type ShotFormMetadataUpdate } from './UpdateFromPhotoButton';
import { HomeDrinkPicker } from './HomeDrinkPicker';

interface AddShotFormProps {
  beans: Bean[];
  onAddShot: (payload: AddShotPayload) => Promise<void>;
}

interface PendingPhoto extends PhotoBlobInput {
  previewUrl: string;
}

const defaultHomeForm = (beans: Bean[]) => ({
  beanId: beans[0]?.id ?? '',
  brewedAt: toDatetimeLocalValue(new Date()),
  beverageType: 'espresso' as BeverageType,
  longBlackWaterMl: '',
  longBlackEspressoMl: '',
  grinder: 'Niche Zero',
  grindSetting: '',
  doseIn: '18',
  yieldOut: '36',
  extractionTime: '28',
  tastingNotes: '',
  rating: 4 as 1 | 2 | 3 | 4 | 5,
});

function clearPendingPhotos(pending: PendingPhoto[]) {
  for (const item of pending) {
    revokePhotoObjectUrl(item.previewUrl);
  }
}

export function AddShotForm({ beans, onAddShot }: AddShotFormProps) {
  const [form, setForm] = useState(() => defaultHomeForm(beans));
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const pendingPhotosRef = useRef(pendingPhotos);
  pendingPhotosRef.current = pendingPhotos;
  const [selectedSuburb, setSelectedSuburb] = useState<SuburbEntry | null>(null);
  const [suburbQuery, setSuburbQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

    const brewedAt = new Date(form.brewedAt);
    if (Number.isNaN(brewedAt.getTime())) {
      setError('Please enter a valid date and time.');
      return;
    }

    if (!form.beanId) {
      setError('Please select a bean.');
      return;
    }

    const doseIn = parseFloat(form.doseIn);
    const yieldOut = parseFloat(form.yieldOut);
    const extractionTime = parseFloat(form.extractionTime);

    if (!form.grindSetting.trim()) {
      setError('Grind setting is required.');
      return;
    }

    if (Number.isNaN(doseIn) || doseIn <= 0) {
      setError('Dose must be a positive number.');
      return;
    }

    if (Number.isNaN(yieldOut) || yieldOut <= 0) {
      setError('Yield must be a positive number.');
      return;
    }

    if (Number.isNaN(extractionTime) || extractionTime <= 0) {
      setError('Extraction time must be a positive number.');
      return;
    }

    let longBlackWaterMl: number | undefined;
    let longBlackEspressoMl: number | undefined;
    if (form.beverageType === 'long_black') {
      longBlackWaterMl = parseFloat(form.longBlackWaterMl);
      longBlackEspressoMl = parseFloat(form.longBlackEspressoMl);
      if (Number.isNaN(longBlackWaterMl) || longBlackWaterMl <= 0) {
        setError('Water volume must be a positive number for long black.');
        return;
      }
      if (Number.isNaN(longBlackEspressoMl) || longBlackEspressoMl <= 0) {
        setError('Espresso volume must be a positive number for long black.');
        return;
      }
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
      if (resolvedSuburb) {
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

      await onAddShot({
        shot: {
          context: 'home_pulled',
          beanId: form.beanId,
          milkCategory: milkCategoryForBeverage(form.beverageType),
          beverageType: form.beverageType,
          brewedAt: brewedAt.toISOString(),
          ...(resolvedSuburb ? { brewSuburb: toStoredSuburb(resolvedSuburb) } : {}),
          ...(weather ? { weather } : {}),
          ...(form.beverageType === 'long_black' && longBlackWaterMl !== undefined
            ? { longBlackWaterMl, longBlackEspressoMl }
            : {}),
          grinder: form.grinder.trim(),
          grindSetting: form.grindSetting.trim(),
          doseIn,
          yieldOut,
          extractionTime,
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
      setForm(defaultHomeForm(beans));
      setStatusMessage(null);
    } catch (err) {
      setError(formatUnknownError(err, 'Failed to save shot.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (beans.length === 0) {
    return (
      <section className="panel">
        <p className="empty-state">Add beans to the catalogue before logging home shots.</p>
      </section>
    );
  }

  const pendingDisplay = pendingPhotos.map(({ photo, previewUrl }) => ({
    photo,
    url: previewUrl,
  }));

  const firstPhotoBlob = pendingPhotos[0]
    ? metadataBlobForPhoto(pendingPhotos[0])
    : null;

  const applyMetadataFromPhoto = (patch: ShotFormMetadataUpdate, _messages: string[]) => {
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
    <section className="panel" aria-labelledby="add-shot-heading">
      <h2 id="add-shot-heading">Log a home shot</h2>
      <p className="panel__intro">
        Coffee you pulled or assembled at home — drink style, extraction, and tasting notes. For
        café coffees, use Log → Café.
      </p>
      <form className="shot-form" onSubmit={handleSubmit} noValidate>
        <HomeDrinkPicker
          beverageType={form.beverageType}
          onBeverageTypeChange={(beverageType) => {
            setForm((f) => {
              const next = { ...f, beverageType };
              if (
                beverageType === 'long_black' &&
                !f.longBlackEspressoMl.trim() &&
                f.yieldOut.trim()
              ) {
                next.longBlackEspressoMl = f.yieldOut;
              }
              return next;
            });
          }}
        />

        {form.beverageType === 'long_black' ? (
          <div className="form-row form-row--pair">
            <div>
              <label htmlFor="longBlackWaterMl">Hot water (ml)</label>
              <input
                id="longBlackWaterMl"
                type="number"
                min="1"
                step="1"
                value={form.longBlackWaterMl}
                onChange={(e) => setForm((f) => ({ ...f, longBlackWaterMl: e.target.value }))}
                placeholder="e.g. 150"
                required
              />
            </div>
            <div>
              <label htmlFor="longBlackEspressoMl">Espresso in cup (ml)</label>
              <input
                id="longBlackEspressoMl"
                type="number"
                min="1"
                step="1"
                value={form.longBlackEspressoMl}
                onChange={(e) => setForm((f) => ({ ...f, longBlackEspressoMl: e.target.value }))}
                placeholder="Often matches yield"
                required
              />
            </div>
          </div>
        ) : null}

        <div className="form-row form-row--pair">
          <div>
            <label htmlFor="brewedAt">When</label>
            <input
              id="brewedAt"
              type="datetime-local"
              value={form.brewedAt}
              onChange={(e) => setForm((f) => ({ ...f, brewedAt: e.target.value }))}
              required
            />
          </div>
          <div>
            <SuburbAutocomplete
              id="brewSuburb"
              label="Suburb"
              value={selectedSuburb}
              inputValue={suburbQuery}
              onInputChange={setSuburbQuery}
              onSelect={setSelectedSuburb}
            />
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="beanId">Bean</label>
          <select
            id="beanId"
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
            <label htmlFor="grinder">Grinder</label>
            <input
              id="grinder"
              type="text"
              value={form.grinder}
              onChange={(e) => setForm((f) => ({ ...f, grinder: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="grindSetting">Grind setting</label>
            <input
              id="grindSetting"
              type="text"
              value={form.grindSetting}
              onChange={(e) => setForm((f) => ({ ...f, grindSetting: e.target.value }))}
              placeholder="e.g. 14.5"
              required
            />
          </div>
        </div>

        <div className="form-row form-row--triple">
          <div>
            <label htmlFor="doseIn">Dose in (g)</label>
            <input
              id="doseIn"
              type="number"
              min="0.1"
              step="0.1"
              value={form.doseIn}
              onChange={(e) => setForm((f) => ({ ...f, doseIn: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="yieldOut">Yield out (g)</label>
            <input
              id="yieldOut"
              type="number"
              min="0.1"
              step="0.1"
              value={form.yieldOut}
              onChange={(e) => setForm((f) => ({ ...f, yieldOut: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="extractionTime">Time (s)</label>
            <input
              id="extractionTime"
              type="number"
              min="1"
              step="1"
              value={form.extractionTime}
              onChange={(e) => setForm((f) => ({ ...f, extractionTime: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="tastingNotes">Tasting notes</label>
          <textarea
            id="tastingNotes"
            rows={3}
            value={form.tastingNotes}
            onChange={(e) => setForm((f) => ({ ...f, tastingNotes: e.target.value }))}
            placeholder="Optional — acidity, body, what to try next…"
          />
        </div>

        <PhotoUpload
          existingCount={pendingPhotos.length}
          onPhotosAdded={handlePhotosAdded}
          label="Shot photos"
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
          name="shot-rating"
          label="Rating"
        />

        {statusMessage ? (
          <p className="photo-upload__hint" aria-live="polite">{statusMessage}</p>
        ) : null}

        {error ? (
          <p className="form-error" role="alert">{error}</p>
        ) : null}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Add shot'}
        </button>
      </form>
    </section>
  );
}
