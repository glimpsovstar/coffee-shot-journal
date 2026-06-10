import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { SuburbEntry } from '../data/auNzSuburbs';
import type {
  AddShotPayload,
  Bean,
  BeverageType,
  Cafe,
  MilkCategory,
  PhotoBlobInput,
  ShotContext,
  ShotSize,
} from '../types';
import { fetchWeatherAt } from '../services/weather';
import { formatBeanChoiceLabel } from '../utils/beans';
import { isDrinkSelectionComplete } from '../utils/drinks';
import { toDatetimeLocalValue } from '../utils/datetime';
import { createPhotoObjectUrl, revokePhotoObjectUrl } from '../utils/photos';
import { resolveSuburbWithGeocoding } from '../services/geocoding';
import { resolveSuburbFromQuery, searchSuburbs, toStoredSuburb } from '../utils/suburbs';
import { DrinkStyleFields } from './DrinkStyleFields';
import { PhotoGalleryEditable } from './PhotoGalleryEditable';
import { PhotoUpload } from './PhotoUpload';
import { StarRating } from './StarRating';
import { SuburbAutocomplete } from './SuburbAutocomplete';
import { UpdateFromPhotoButton, type ShotFormMetadataUpdate } from './UpdateFromPhotoButton';

interface AddShotFormProps {
  beans: Bean[];
  cafes: Cafe[];
  onAddShot: (payload: AddShotPayload) => void;
}

interface PendingPhoto extends PhotoBlobInput {
  previewUrl: string;
}

const defaultHomeForm = (beans: Bean[]) => ({
  beanId: beans[0]?.id ?? '',
  brewedAt: toDatetimeLocalValue(new Date()),
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

export function AddShotForm({ beans, cafes, onAddShot }: AddShotFormProps) {
  const [context, setContext] = useState<ShotContext>('home_pulled');
  const [form, setForm] = useState(() => defaultHomeForm(beans));
  const [cafeId, setCafeId] = useState(cafes[0]?.id ?? '');
  const [milkCategory, setMilkCategory] = useState<MilkCategory | ''>('');
  const [beverageType, setBeverageType] = useState<BeverageType | ''>('');
  const [shotSize, setShotSize] = useState<ShotSize | ''>('');
  const [shotSizeCustom, setShotSizeCustom] = useState('');
  const [priceAud, setPriceAud] = useState('');
  const [wouldOrderAgain, setWouldOrderAgain] = useState(true);
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

    if (context === 'cafe_purchased') {
      if (!cafeId) {
        setError('Select a café — add one under Log → Cafés first.');
        return;
      }
      if (
        !isDrinkSelectionComplete({
          milkCategory: milkCategory as MilkCategory,
          beverageType: beverageType as BeverageType,
          shotSize: shotSize as ShotSize,
          shotSizeCustom,
        })
      ) {
        setError('Complete the drink selection.');
        return;
      }

      const price = priceAud.trim() ? parseFloat(priceAud) : undefined;

      onAddShot({
        shot: {
          context: 'cafe_purchased',
          cafeId,
          beanId: form.beanId || '',
          brewedAt: brewedAt.toISOString(),
          milkCategory: milkCategory as MilkCategory,
          beverageType: beverageType as BeverageType,
          shotSize: shotSize as ShotSize,
          ...(shotSize === 'custom' ? { shotSizeCustom: shotSizeCustom.trim() } : {}),
          ...(price !== undefined && !Number.isNaN(price) ? { priceAud: price } : {}),
          wouldOrderAgain,
          grinder: '',
          grindSetting: '',
          doseIn: 0,
          yieldOut: 0,
          extractionTime: 0,
          tastingNotes: form.tastingNotes.trim(),
          rating: form.rating,
          photos: pendingPhotos.map((p) => p.photo),
        },
        photoBlobs: pendingPhotos.map(({ photo, blob }) => ({ photo, blob })),
      });

      clearPendingPhotos(pendingPhotos);
      setPendingPhotos([]);
      setForm(defaultHomeForm(beans));
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

      onAddShot({
        shot: {
          context: 'home_pulled',
          beanId: form.beanId,
          brewedAt: brewedAt.toISOString(),
          ...(resolvedSuburb ? { brewSuburb: toStoredSuburb(resolvedSuburb) } : {}),
          ...(weather ? { weather } : {}),
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
    } finally {
      setSubmitting(false);
    }
  };

  if (context === 'home_pulled' && beans.length === 0) {
    return (
      <section className="panel">
        <p className="empty-state">Add beans to the catalogue before logging home shots.</p>
      </section>
    );
  }

  if (context === 'cafe_purchased' && cafes.length === 0) {
    return (
      <section className="panel">
        <p className="empty-state">Add a café under Log → Cafés before logging a café coffee.</p>
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
      <h2 id="add-shot-heading">Log a shot</h2>
      <form className="shot-form" onSubmit={handleSubmit} noValidate>
        <fieldset className="shot-context-fieldset">
          <legend>Where was this coffee?</legend>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="shotContext"
                value="home_pulled"
                checked={context === 'home_pulled'}
                onChange={() => setContext('home_pulled')}
              />
              I pulled this at home
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="shotContext"
                value="cafe_purchased"
                checked={context === 'cafe_purchased'}
                onChange={() => setContext('cafe_purchased')}
              />
              I ordered this at a café
            </label>
          </div>
        </fieldset>

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
          {context === 'cafe_purchased' ? (
            <div>
              <label htmlFor="cafeId">Café</label>
              <select
                id="cafeId"
                value={cafeId}
                onChange={(e) => setCafeId(e.target.value)}
                required
              >
                {cafes.map((cafe) => (
                  <option key={cafe.id} value={cafe.id}>{cafe.name}</option>
                ))}
              </select>
            </div>
          ) : (
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
          )}
        </div>

        {context === 'cafe_purchased' ? (
          <>
            <DrinkStyleFields
              milkCategory={milkCategory}
              beverageType={beverageType}
              shotSize={shotSize}
              shotSizeCustom={shotSizeCustom}
              onMilkCategoryChange={(value) => {
                setMilkCategory(value);
                setBeverageType('');
                setShotSize('');
              }}
              onBeverageTypeChange={setBeverageType}
              onShotSizeChange={setShotSize}
              onShotSizeCustomChange={setShotSizeCustom}
            />
            {beans.length > 0 ? (
              <div className="form-row">
                <label htmlFor="cafeBeanId">Bean (optional)</label>
                <select
                  id="cafeBeanId"
                  value={form.beanId}
                  onChange={(e) => setForm((f) => ({ ...f, beanId: e.target.value }))}
                >
                  <option value="">Unknown / not listed</option>
                  {beans.map((bean) => (
                    <option key={bean.id} value={bean.id}>
                      {formatBeanChoiceLabel(bean)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="form-row form-row--pair">
              <div>
                <label htmlFor="priceAud">Price (AUD)</label>
                <input
                  id="priceAud"
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
          </>
        ) : (
          <>
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
          </>
        )}

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
        {context === 'home_pulled' ? (
          <UpdateFromPhotoButton imageBlob={firstPhotoBlob} onUpdate={applyMetadataFromPhoto} />
        ) : null}

        <StarRating
          value={form.rating}
          onChange={(rating) => setForm((f) => ({ ...f, rating }))}
          name="shot-rating"
          label="Rating"
        />

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
          {submitting ? 'Saving…' : 'Add shot'}
        </button>
      </form>
    </section>
  );
}
