import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { AddShotPayload, Bean, BeverageType, Cafe, PhotoBlobInput, ShotWeather } from '../types';
import { fetchWeatherAt } from '../services/weather';
import { toDatetimeLocalValue } from '../utils/datetime';
import {
  isCafeDrinkComplete,
  milkCategoryForBeverage,
  shotSizeFromExtraShot,
} from '../utils/drinks';
import { createPhotoObjectUrl, revokePhotoObjectUrl } from '../utils/photos';
import { CafeDrinkPicker } from './CafeDrinkPicker';
import { PhotoGalleryEditable } from './PhotoGalleryEditable';
import { PhotoUpload } from './PhotoUpload';
import { StarRating } from './StarRating';
import { WeatherDisplay } from './WeatherDisplay';

interface LogCafeCoffeeFormProps {
  cafe: Cafe;
  beans: Bean[];
  onAddCoffee: (payload: AddShotPayload) => Promise<void>;
}

interface PendingPhoto extends PhotoBlobInput {
  previewUrl: string;
}

export function LogCafeCoffeeForm({ cafe, beans, onAddCoffee }: LogCafeCoffeeFormProps) {
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
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const pendingPhotosRef = useRef(pendingPhotos);
  pendingPhotosRef.current = pendingPhotos;
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      for (const item of pendingPhotosRef.current) {
        revokePhotoObjectUrl(item.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    setWeatherPreview(null);
  }, [brewedAt, cafe.id]);

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

  const resetForm = () => {
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
    setStatusMessage(null);
    for (const item of pendingPhotos) {
      revokePhotoObjectUrl(item.previewUrl);
    }
    setPendingPhotos([]);
  };

  const previewWeather = async (at: Date) => {
    setStatusMessage('Fetching weather for this visit…');
    try {
      const weather = await fetchWeatherAt({
        latitude: cafe.latitude,
        longitude: cafe.longitude,
        at,
      });
      setWeatherPreview(weather);
      setStatusMessage(null);
    } catch (err) {
      setWeatherPreview(null);
      setStatusMessage(
        err instanceof Error
          ? `${err.message} Coffee will be saved without weather.`
          : 'Weather unavailable. Coffee will be saved without weather.',
      );
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isCafeDrinkComplete(beverageType)) {
      setError('Pick a coffee from the menu.');
      return;
    }

    const brewed = new Date(brewedAt);
    if (Number.isNaN(brewed.getTime())) {
      setError('Please enter a valid date and time.');
      return;
    }

    const price = priceAud.trim() ? parseFloat(priceAud) : undefined;
    const drink = beverageType as BeverageType;

    setSubmitting(true);
    try {
      let weather = weatherPreview;
      if (!weather) {
        setStatusMessage('Fetching weather for this visit…');
        try {
          weather = await fetchWeatherAt({
            latitude: cafe.latitude,
            longitude: cafe.longitude,
            at: brewed,
          });
        } catch (err) {
          setStatusMessage(
            err instanceof Error
              ? `${err.message} Coffee will be saved without weather.`
              : 'Weather unavailable. Coffee will be saved without weather.',
          );
        }
      }

      await onAddCoffee({
        shot: {
          context: 'cafe_purchased',
          cafeId: cafe.id,
          beanId: beanId || '',
          brewedAt: brewed.toISOString(),
          milkCategory: milkCategoryForBeverage(drink),
          beverageType: drink,
          shotSize: shotSizeFromExtraShot(extraShot),
          ...(extraShot ? { extraShot: true } : {}),
          ...(alternativeMilk ? { alternativeMilk: true } : {}),
          ...(weather ? { weather } : {}),
          ...(price !== undefined && !Number.isNaN(price) ? { priceAud: price } : {}),
          wouldOrderAgain,
          grinder: '',
          grindSetting: '',
          doseIn: 0,
          yieldOut: 0,
          extractionTime: 0,
          tastingNotes: tastingNotes.trim(),
          rating,
          photos: pendingPhotos.map((p) => p.photo),
        },
        photoBlobs: pendingPhotos.map(({ photo, blob }) => ({ photo, blob })),
      });
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log coffee.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingDisplay = pendingPhotos.map(({ photo, previewUrl }) => ({
    photo,
    url: previewUrl,
  }));

  return (
    <section className="log-cafe-coffee" aria-labelledby={`log-coffee-${cafe.id}`}>
      <h4 id={`log-coffee-${cafe.id}`} className="log-cafe-coffee__heading">
        Log a coffee
      </h4>
      <p className="log-cafe-coffee__intro">
        What did you order at {cafe.name}? Set when you visited, then pick from the menu.
      </p>
      <form className="shot-form" onSubmit={handleSubmit} noValidate>
        <div className="form-row form-row--pair">
          <div>
            <label htmlFor={`brewedAt-${cafe.id}`}>When</label>
            <input
              id={`brewedAt-${cafe.id}`}
              type="datetime-local"
              value={brewedAt}
              onChange={(e) => setBrewedAt(e.target.value)}
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
                  void previewWeather(brewed);
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
          <span className="form-label">Rating</span>
          <StarRating value={rating} onChange={setRating} />
        </div>

        {beans.length > 0 ? (
          <div className="form-row">
            <label htmlFor={`bean-${cafe.id}`}>Bean (optional)</label>
            <select
              id={`bean-${cafe.id}`}
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

        <div className="form-row">
          <label htmlFor={`notes-${cafe.id}`}>Tasting notes</label>
          <textarea
            id={`notes-${cafe.id}`}
            rows={2}
            value={tastingNotes}
            onChange={(e) => setTastingNotes(e.target.value)}
            placeholder="Chocolate, too bitter, perfect temp…"
          />
        </div>

        <div className="form-row form-row--pair">
          <div>
            <label htmlFor={`price-${cafe.id}`}>Price (AUD)</label>
            <input
              id={`price-${cafe.id}`}
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
          existingCount={pendingPhotos.length}
          onPhotosAdded={handlePhotosAdded}
          label="Coffee photos"
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
          {submitting ? 'Saving…' : 'Log coffee'}
        </button>
      </form>
    </section>
  );
}
