import { useState, type FormEvent } from 'react';
import type { AddCafePayload, PhotoBlobInput } from '../types';
import { geocodePlaceQuery } from '../services/geocoding';
import { createPhotoObjectUrl, revokePhotoObjectUrl } from '../utils/photos';
import { PhotoGalleryEditable } from './PhotoGalleryEditable';
import { PhotoUpload } from './PhotoUpload';

interface AddCafeFormProps {
  onAddCafe: (payload: AddCafePayload) => void | Promise<void>;
}

interface PendingPhoto extends PhotoBlobInput {
  previewUrl: string;
}

export function AddCafeForm({ onAddCafe }: AddCafeFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Café name is required.');
      return;
    }

    setSubmitting(true);
    try {
      setStatusMessage('Looking up location…');
      const query = [trimmedName, address.trim()].filter(Boolean).join(', ');
      const place = await geocodePlaceQuery(query);
      if (!place) {
        setError('Could not find that location — try a fuller address (suburb, city).');
        return;
      }

      await onAddCafe({
        cafe: {
          name: trimmedName,
          address: address.trim() || place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          notes: notes.trim(),
          photos: pendingPhotos.map((p) => p.photo),
        },
        photoBlobs: pendingPhotos.map(({ photo, blob }) => ({ photo, blob })),
      });

      for (const item of pendingPhotos) {
        revokePhotoObjectUrl(item.previewUrl);
      }
      setName('');
      setAddress('');
      setNotes('');
      setPendingPhotos([]);
      setStatusMessage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add café.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingDisplay = pendingPhotos.map(({ photo, previewUrl }) => ({
    photo,
    url: previewUrl,
  }));

  return (
    <section className="panel" aria-labelledby="add-cafe-heading">
      <h2 id="add-cafe-heading">Add a café</h2>
      <p className="panel__intro">
        Save places you visit. We look up coordinates from the name and address for the map.
      </p>
      <form className="shot-form" onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <label htmlFor="cafeName">Name</label>
          <input
            id="cafeName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Market Lane Coffee"
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="cafeAddress">Address or suburb</label>
          <input
            id="cafeAddress"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Collins St, Melbourne VIC"
          />
        </div>
        <div className="form-row">
          <label htmlFor="cafeNotes">Notes</label>
          <textarea
            id="cafeNotes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Vibe, favourite table, roaster on site…"
          />
        </div>
        <PhotoUpload
          existingCount={pendingPhotos.length}
          onPhotosAdded={handlePhotosAdded}
          label="Café photos"
        />
        <PhotoGalleryEditable
          items={pendingDisplay}
          label="Photos to attach"
          onRemove={handleRemovePending}
        />
        {statusMessage ? (
          <p className="photo-upload__hint" aria-live="polite">{statusMessage}</p>
        ) : null}
        {error ? (
          <p className="form-error" role="alert">{error}</p>
        ) : null}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Add café'}
        </button>
      </form>
    </section>
  );
}
