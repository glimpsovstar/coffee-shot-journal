import { useState, type FormEvent } from 'react';
import type {
  AddCafeVisitPayload,
  Bean,
  BeverageType,
  Cafe,
  PhotoBlobInput,
  Shot,
  ShotWeather,
} from '../types';
import { reverseGeocodePlaceLabel } from '../services/geocoding';
import { searchCafesNearLocation, type CafePlaceSuggestion } from '../services/googlePlaces';
import { fetchWeatherAt } from '../services/weather';
import { isGooglePlacesEnabled } from '../lib/mapsConfig';
import { geocodePlaceQuery } from '../services/geocoding';
import { extractGpsFromPhotoBlob } from '../utils/photoExif';
import { buildCafeCoffeeShot } from '../utils/cafeCoffee';
import { formatUnknownError } from '../utils/errors';
import { isCafeDrinkComplete } from '../utils/drinks';
import { metadataBlobForPhoto } from '../utils/photos';
import { downloadCafeMapKmlFile } from '../utils/cafeMapKml';
import { toDatetimeLocalValue } from '../utils/datetime';
import { createPhotoObjectUrl, revokePhotoObjectUrl } from '../utils/photos';
import { CafeDrinkPicker } from './CafeDrinkPicker';
import { CafeMapEmbed } from './CafeMapEmbed';
import { CafeMapOpenLink } from './CafeMapOpenLink';
import { CafePlaceField } from './CafePlaceField';
import { PhotoGalleryEditable } from './PhotoGalleryEditable';
import { PhotoUpload } from './PhotoUpload';
import { StarRating } from './StarRating';
import { UpdateFromPhotoButton, type ShotFormMetadataUpdate } from './UpdateFromPhotoButton';
import { WeatherDisplay } from './WeatherDisplay';

interface AddCafeFormProps {
  beans: Bean[];
  cafes: Cafe[];
  shots: Shot[];
  onAddVisit: (payload: AddCafeVisitPayload) => Promise<Cafe>;
  id?: string;
  /** Controlled expand/collapse (used when opening from café picker header). */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

interface PendingPhoto extends PhotoBlobInput {
  previewUrl: string;
}

export function AddCafeForm({
  beans,
  cafes,
  shots,
  onAddVisit,
  id,
  expanded: expandedProp,
  onExpandedChange,
}: AddCafeFormProps) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const isControlled = expandedProp !== undefined;
  const expanded = isControlled ? expandedProp : internalExpanded;

  const setExpanded = (value: boolean) => {
    if (isControlled) onExpandedChange?.(value);
    else setInternalExpanded(value);
  };
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [cafeNotes, setCafeNotes] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<CafePlaceSuggestion | null>(null);
  const [photoSuggestions, setPhotoSuggestions] = useState<CafePlaceSuggestion[]>([]);
  const [cafePhotos, setCafePhotos] = useState<PendingPhoto[]>([]);
  const [brewedAt, setBrewedAt] = useState(() => toDatetimeLocalValue(new Date()));
  const [beverageType, setBeverageType] = useState<BeverageType | ''>('');
  const [extraShot, setExtraShot] = useState(false);
  const [alternativeMilk, setAlternativeMilk] = useState(false);
  const [beanId, setBeanId] = useState('');
  const [priceAud, setPriceAud] = useState('');
  const [wouldOrderAgain, setWouldOrderAgain] = useState(true);
  const [tastingNotes, setTastingNotes] = useState('');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [weatherPreview, setWeatherPreview] = useState<ShotWeather | null>(null);
  const [coffeePhotos, setCoffeePhotos] = useState<PendingPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [savedCafeActions, setSavedCafeActions] = useState<Cafe | null>(null);

  const resetCoffeeFields = () => {
    setBrewedAt(toDatetimeLocalValue(new Date()));
    setBeverageType('');
    setExtraShot(false);
    setAlternativeMilk(false);
    setBeanId('');
    setPriceAud('');
    setWouldOrderAgain(true);
    setTastingNotes('');
    setRating(4);
    setWeatherPreview(null);
    for (const item of coffeePhotos) {
      revokePhotoObjectUrl(item.previewUrl);
    }
    setCoffeePhotos([]);
  };

  const clearFormFields = () => {
    setName('');
    setAddress('');
    setCafeNotes('');
    setSelectedPlace(null);
    setPhotoSuggestions([]);
    for (const item of cafePhotos) {
      revokePhotoObjectUrl(item.previewUrl);
    }
    setCafePhotos([]);
    resetCoffeeFields();
  };

  const resolveLocationFromPhoto = async (inputs: PhotoBlobInput[]) => {
    for (const input of inputs) {
      const gps = await extractGpsFromPhotoBlob(metadataBlobForPhoto(input));
      if (!gps) continue;

      setStatusMessage('Photo GPS found — looking up nearby cafés…');

      if (isGooglePlacesEnabled()) {
        try {
          const nearby = await searchCafesNearLocation(gps.latitude, gps.longitude);
          setPhotoSuggestions(nearby);
          if (nearby.length > 0) {
            setStatusMessage('Photo GPS found — pick a nearby café below or keep typing a name.');
            return;
          }
        } catch {
          // fall through
        }
      }

      const label = await reverseGeocodePlaceLabel(gps.latitude, gps.longitude);
      if (label) {
        setAddress(label);
        setStatusMessage('Photo GPS found — address filled. Add the café name or pick from suggestions.');
      } else {
        setStatusMessage('Photo GPS found but could not resolve an address — enter details manually.');
      }
      return;
    }
  };

  const handleCafePhotosAdded = (inputs: PhotoBlobInput[]) => {
    setCafePhotos((current) => [
      ...current,
      ...inputs.map((input) => ({
        ...input,
        previewUrl: createPhotoObjectUrl(input.blob),
      })),
    ]);
    if (inputs.length > 0) {
      void resolveLocationFromPhoto(inputs);
    }
  };

  const handleCoffeePhotosAdded = (inputs: PhotoBlobInput[]) => {
    setCoffeePhotos((current) => [
      ...current,
      ...inputs.map((input) => ({
        ...input,
        previewUrl: createPhotoObjectUrl(input.blob),
      })),
    ]);
  };

  const previewWeather = async (latitude: number, longitude: number, at: Date) => {
    setStatusMessage('Fetching weather for this visit…');
    try {
      const weather = await fetchWeatherAt({ latitude, longitude, at });
      setWeatherPreview(weather);
      setStatusMessage(null);
    } catch (err) {
      setWeatherPreview(null);
      setStatusMessage(
        err instanceof Error
          ? `${err.message} Visit will be saved without weather.`
          : 'Weather unavailable. Visit will be saved without weather.',
      );
    }
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

    if (!isCafeDrinkComplete(beverageType)) {
      setError('Pick the coffee you ordered from the menu.');
      return;
    }

    const brewed = new Date(brewedAt);
    if (Number.isNaN(brewed.getTime())) {
      setError('Please enter a valid date and time.');
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

      let weather = weatherPreview;
      if (!weather) {
        try {
          weather = await fetchWeatherAt({
            latitude,
            longitude,
            at: brewed,
          });
        } catch (err) {
          setStatusMessage(
            err instanceof Error
              ? `${err.message} Visit will be saved without weather.`
              : 'Weather unavailable. Visit will be saved without weather.',
          );
        }
      }

      const price = priceAud.trim() ? parseFloat(priceAud) : undefined;
      const drink = beverageType as BeverageType;

      const cafe = await onAddVisit({
        cafe: {
          cafe: {
            name: trimmedName,
            address: resolvedAddress,
            latitude,
            longitude,
            googlePlaceId,
            notes: cafeNotes.trim(),
            photos: cafePhotos.map((p) => p.photo),
          },
          photoBlobs: cafePhotos.map(({ photo, blob }) => ({ photo, blob })),
        },
        coffee: {
          shot: buildCafeCoffeeShot('pending', {
            beverageType: drink,
            extraShot,
            alternativeMilk,
            beanId,
            brewedAtIso: brewed.toISOString(),
            rating,
            tastingNotes,
            priceAud: price !== undefined && !Number.isNaN(price) ? price : undefined,
            wouldOrderAgain,
            weather: weather ?? undefined,
            photos: coffeePhotos.map((p) => p.photo),
          }),
          photoBlobs: coffeePhotos.map(({ photo, blob }) => ({ photo, blob })),
        },
      });

      clearFormFields();
      setExpanded(false);
      setSavedCafeActions(cafe);
      setStatusMessage(`Saved ${cafe.name} and your ${drink.replace('_', ' ')}.`);
    } catch (err) {
      console.error('Failed to save café visit', err);
      setError(formatUnknownError(err, 'Failed to save visit.'));
    } finally {
      setSubmitting(false);
    }
  };

  const cafePhotoDisplay = cafePhotos.map(({ photo, previewUrl }) => ({
    photo,
    url: previewUrl,
  }));
  const coffeePhotoDisplay = coffeePhotos.map(({ photo, previewUrl }) => ({
    photo,
    url: previewUrl,
  }));
  const visitMetadataBlobs = [
    ...cafePhotos.map((p) => metadataBlobForPhoto(p)),
    ...coffeePhotos.map((p) => metadataBlobForPhoto(p)),
  ];

  const previewLatitude = selectedPlace?.latitude;
  const previewLongitude = selectedPlace?.longitude;
  const hasMapPreview =
    previewLatitude !== undefined &&
    previewLongitude !== undefined &&
    Number.isFinite(previewLatitude) &&
    Number.isFinite(previewLongitude);

  const journalCafes = cafes;

  const handleDownloadCafeMap = () => {
    const result = downloadCafeMapKmlFile(journalCafes, shots);
    const skipped =
      result.skippedCount > 0 ? ` (${result.skippedCount} without coordinates skipped)` : '';
    setStatusMessage(`Exported ${result.exportedCount} cafés to KML${skipped}.`);
    setError(null);
  };

  const applyMetadataFromPhoto = (patch: ShotFormMetadataUpdate, _messages: string[]) => {
    if (patch.brewedAt) {
      setBrewedAt(patch.brewedAt);
      setWeatherPreview(null);
    }
  };

  return (
    <section
      id={id}
      className="panel add-cafe-form"
      aria-labelledby="add-cafe-heading"
    >
      <header className="add-cafe-form__header">
        <div>
          <h2 id="add-cafe-heading">Log a café visit</h2>
          <p className="panel__intro">
            One step — save the place, your notes, and the coffee you ordered.
          </p>
        </div>
        {isControlled ? (
          <button
            type="button"
            className="btn-ghost add-cafe-form__toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded(false)}
          >
            Hide form
          </button>
        ) : null}
      </header>
      {expanded ? (
        <form className="shot-form" onSubmit={handleSubmit} noValidate>
          <CafePlaceField
            name={name}
            address={address}
            photoSuggestions={photoSuggestions}
            onNameChange={(value) => {
              setName(value);
              setWeatherPreview(null);
              setSavedCafeActions(null);
            }}
            onAddressChange={(value) => {
              setAddress(value);
              setWeatherPreview(null);
              setSavedCafeActions(null);
            }}
            onSelectPlace={setSelectedPlace}
          />

          {hasMapPreview ? (
            <CafeMapEmbed
              name={name.trim() || 'Selected café'}
              latitude={previewLatitude!}
              longitude={previewLongitude!}
              googlePlaceId={selectedPlace?.placeId}
              preview
            />
          ) : null}

          <div className="form-row form-row--pair">
            <div>
              <label htmlFor="visitWhen">When</label>
              <input
                id="visitWhen"
                type="datetime-local"
                value={brewedAt}
                onChange={(e) => {
                  setBrewedAt(e.target.value);
                  setWeatherPreview(null);
                }}
                required
              />
            </div>
            <div className="log-cafe-coffee__weather">
              <span className="form-label">Weather at café</span>
              {weatherPreview ? (
                <WeatherDisplay weather={weatherPreview} />
              ) : (
                <button
                  type="button"
                  className="btn-ghost log-cafe-coffee__weather-btn"
                  onClick={() => {
                    const brewed = new Date(brewedAt);
                    if (Number.isNaN(brewed.getTime())) {
                      setError('Enter a valid date and time before checking weather.');
                      return;
                    }
                    const lat = selectedPlace?.latitude;
                    const lng = selectedPlace?.longitude;
                    if (lat === undefined || lng === undefined) {
                      setError('Pick a Google address or enter a location before checking weather.');
                      return;
                    }
                    void previewWeather(lat, lng, brewed);
                  }}
                >
                  Check weather for this time
                </button>
              )}
            </div>
          </div>

          <CafeDrinkPicker
            beverageType={beverageType}
            extraShot={extraShot}
            alternativeMilk={alternativeMilk}
            onBeverageTypeChange={setBeverageType}
            onExtraShotChange={setExtraShot}
            onAlternativeMilkChange={setAlternativeMilk}
          />

          <div className="form-row">
            <label htmlFor="cafeNotes">Café notes</label>
            <textarea
              id="cafeNotes"
              rows={2}
              value={cafeNotes}
              onChange={(e) => setCafeNotes(e.target.value)}
              placeholder="Vibe, favourite table, roaster on site…"
            />
          </div>

          <div className="form-row">
            <label htmlFor="coffeeTastingNotes">Coffee tasting notes</label>
            <textarea
              id="coffeeTastingNotes"
              rows={2}
              value={tastingNotes}
              onChange={(e) => setTastingNotes(e.target.value)}
              placeholder="Chocolate, too bitter, perfect temp…"
            />
          </div>

          <div className="form-row">
            <span className="form-label">Rating</span>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {beans.length > 0 ? (
            <div className="form-row">
              <label htmlFor="visitBeanId">Bean (optional)</label>
              <select
                id="visitBeanId"
                value={beanId}
                onChange={(e) => setBeanId(e.target.value)}
              >
                <option value="">Unknown / not listed</option>
                {beans.map((bean) => (
                  <option key={bean.id} value={bean.id}>
                    {bean.roaster} — {bean.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="form-row form-row--pair">
            <div>
              <label htmlFor="visitPrice">Price (AUD)</label>
              <input
                id="visitPrice"
                type="number"
                min="0"
                step="0.5"
                value={priceAud}
                onChange={(e) => setPriceAud(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="form-row--checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={wouldOrderAgain}
                  onChange={(e) => setWouldOrderAgain(e.target.checked)}
                />
                Would order again
              </label>
            </div>
          </div>

          <PhotoUpload
            existingCount={cafePhotos.length}
            onPhotosAdded={handleCafePhotosAdded}
            label="Café photos"
          />
          <PhotoGalleryEditable
            items={cafePhotoDisplay}
            label="Café photos to attach"
            onRemove={(photoId) => {
              setCafePhotos((current) => {
                const target = current.find((p) => p.photo.id === photoId);
                if (target) revokePhotoObjectUrl(target.previewUrl);
                return current.filter((p) => p.photo.id !== photoId);
              });
            }}
          />

          <PhotoUpload
            existingCount={coffeePhotos.length}
            onPhotosAdded={handleCoffeePhotosAdded}
            label="Coffee photos"
          />
          <PhotoGalleryEditable
            items={coffeePhotoDisplay}
            label="Coffee photos to attach"
            onRemove={(photoId) => {
              setCoffeePhotos((current) => {
                const target = current.find((p) => p.photo.id === photoId);
                if (target) revokePhotoObjectUrl(target.previewUrl);
                return current.filter((p) => p.photo.id !== photoId);
              });
            }}
          />
          <UpdateFromPhotoButton
            imageBlobs={visitMetadataBlobs}
            locationKind="none"
            onUpdate={applyMetadataFromPhoto}
          />

          {error ? (
            <p className="form-error" role="alert">{error}</p>
          ) : null}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save visit'}
          </button>
        </form>
      ) : null}

      {statusMessage ? (
        <p className="photo-upload__hint add-cafe-form__success" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}
      {savedCafeActions ? (
        <div className="add-cafe-form__map-actions">
          <CafeMapOpenLink
            className="btn-secondary add-cafe-form__maps-btn"
            latitude={savedCafeActions.latitude}
            longitude={savedCafeActions.longitude}
            googlePlaceId={savedCafeActions.googlePlaceId}
          />
          <button
            type="button"
            className="btn-ghost add-cafe-form__maps-btn"
            onClick={handleDownloadCafeMap}
            disabled={journalCafes.length === 0}
          >
            Download café map (KML)
          </button>
          <p className="photo-upload__hint">
            Save this place in Google Maps, or import the KML in Google My Maps to see all your
            cafés on Google Maps.
          </p>
        </div>
      ) : null}
    </section>
  );
}
