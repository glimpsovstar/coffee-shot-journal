import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { AddShotPayload, Bean, PhotoBlobInput } from '../types';
import { formatBeanChoiceLabel } from '../utils/beans';
import { toDatetimeLocalValue } from '../utils/datetime';
import { createPhotoObjectUrl, revokePhotoObjectUrl } from '../utils/photos';
import { PhotoGalleryEditable } from './PhotoGalleryEditable';
import { PhotoUpload } from './PhotoUpload';
import { StarRating } from './StarRating';
import { UpdateFromPhotoButton, type ShotFormMetadataUpdate } from './UpdateFromPhotoButton';

interface AddShotFormProps {
  beans: Bean[];
  onAddShot: (payload: AddShotPayload) => void;
}

interface PendingPhoto extends PhotoBlobInput {
  previewUrl: string;
}

const defaultFormState = (beans: Bean[]) => ({
  beanId: beans[0]?.id ?? '',
  brewedAt: toDatetimeLocalValue(new Date()),
  brewedLocation: '',
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
  const [form, setForm] = useState(() => defaultFormState(beans));
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const pendingPhotosRef = useRef(pendingPhotos);
  pendingPhotosRef.current = pendingPhotos;
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

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

    const brewedAt = new Date(form.brewedAt);
    if (Number.isNaN(brewedAt.getTime())) {
      setError('Please enter a valid date and time.');
      return;
    }

    const location = form.brewedLocation.trim();

    onAddShot({
      shot: {
        beanId: form.beanId,
        brewedAt: brewedAt.toISOString(),
        ...(location ? { brewedLocation: location } : {}),
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
    setForm(defaultFormState(beans));
  };

  if (beans.length === 0) {
    return (
      <section className="panel">
        <p className="empty-state">Add beans to the catalogue before logging shots.</p>
      </section>
    );
  }

  const pendingDisplay = pendingPhotos.map(({ photo, previewUrl }) => ({
    photo,
    url: previewUrl,
  }));

  const firstPhotoBlob = pendingPhotos[0]?.blob ?? null;

  const applyMetadataFromPhoto = (patch: ShotFormMetadataUpdate, _messages: string[]) => {
    setForm((f) => ({
      ...f,
      brewedAt: patch.brewedAt ?? f.brewedAt,
      brewedLocation: patch.brewedLocation ?? f.brewedLocation,
    }));
  };

  return (
    <section className="panel" aria-labelledby="add-shot-heading">
      <h2 id="add-shot-heading">Log a shot</h2>
      <form className="shot-form" onSubmit={handleSubmit} noValidate>
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
            <label htmlFor="brewedAt">Brewed</label>
            <input
              id="brewedAt"
              type="datetime-local"
              value={form.brewedAt}
              onChange={(e) => setForm((f) => ({ ...f, brewedAt: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="brewedLocation">Location</label>
            <input
              id="brewedLocation"
              type="text"
              value={form.brewedLocation}
              placeholder="e.g. from photo GPS or your kitchen"
              onChange={(e) => setForm((f) => ({ ...f, brewedLocation: e.target.value }))}
            />
          </div>
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

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary">
          Add shot
        </button>
      </form>
    </section>
  );
}
