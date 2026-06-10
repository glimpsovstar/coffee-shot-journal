import { useState, type FormEvent } from 'react';
import type { AddCafePayload, PhotoBlobInput } from '../types';
import { reverseGeocodePlaceLabel } from '../services/geocoding';
import { searchCafesNearLocation, type CafePlaceSuggestion } from '../services/googlePlaces';
import { isGooglePlacesEnabled } from '../lib/mapsConfig';
import { geocodePlaceQuery } from '../services/geocoding';
import { extractGpsFromPhotoBlob } from '../utils/photoExif';
import { createPhotoObjectUrl, revokePhotoObjectUrl } from '../utils/photos';
import { CafePlaceField } from './CafePlaceField';
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
  const [selectedPlace, setSelectedPlace] = useState<CafePlaceSuggestion | null>(null);
  const [photoSuggestions, setPhotoSuggestions] = useState<CafePlaceSuggestion[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const resolveLocationFromPhoto = async (blob: Blob) => {
    const gps = await extractGpsFromPhotoBlob(blob);
    if (!gps) return;

    setStatusMessage('Photo GPS found — looking up nearby cafés…');

    if (isGooglePlacesEnabled()) {
      try {
        const nearby = await searchCafesNearLocation(gps.latitude, gps.longitude);
        setPhotoSuggestions(nearby);
        if (nearby.length > 0) {
          setStatusMessage(
            `Photo GPS found — pick a nearby café below or keep typing a name.`,
          );
          return;
        }
      } catch {
        // fall through to reverse geocode label
      }
    }

    const label = await reverseGeocodePlaceLabel(gps.latitude, gps.longitude);
    if (label) {
      setAddress(label);
      setStatusMessage('Photo GPS found — address filled. Add the café name or pick from suggestions when available.');
    } else {
      setStatusMessage('Photo GPS found but could not resolve an address — enter details manually.');
    }
  };

  const handlePhotosAdded = (inputs: PhotoBlobInput[]) => {
    setPendingPhotos((current) => [
      ...current,
      ...inputs.map((input) => ({
        ...input,
        previewUrl: createPhotoObjectUrl(input.blob),
      })),
    ]);

    if (inputs[0]) {
      void resolveLocationFromPhoto(inputs[0].blob);
    }
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
      let latitude = selectedPlace?.latitude;
      let longitude = selectedPlace?.longitude;
      let resolvedAddress = address.trim() || selectedPlace?.address;
      let googlePlaceId = selectedPlace?.placeId;

      if (latitude === undefined || longitude === undefined) {
        setStatusMessage('Looking up location…');
        const query = [trimmedName, address.trim()].filter(Boolean).join(', ');
        const place = await geocodePlaceQuery(query);
        if (!place) {
          setError('Could not find that location — pick a Google suggestion or add a fuller address.');
          return;
        }
        latitude = place.latitude;
        longitude = place.longitude;
        resolvedAddress = resolvedAddress || place.address;
      }

      await onAddCafe({
        cafe: {
          name: trimmedName,
          address: resolvedAddress,
          latitude,
          longitude,
          googlePlaceId,
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
      setSelectedPlace(null);
      setPhotoSuggestions([]);
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
        Type a café name for Google suggestions, or upload a photo with location data to pin nearby places.
      </p>
      <form className="shot-form" onSubmit={handleSubmit} noValidate>
        <CafePlaceField
          name={name}
          address={address}
          selectedPlace={selectedPlace}
          photoSuggestions={photoSuggestions}
          onNameChange={setName}
          onAddressChange={setAddress}
          onSelectPlace={setSelectedPlace}
        />
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
