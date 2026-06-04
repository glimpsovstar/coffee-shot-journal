import { useEffect, useRef, useState, type FormEvent } from 'react';
import type {
  AddBeanPayload,
  BagSize,
  BeanDraft,
  BeanKind,
  BlendComponent,
  PhotoBlobInput,
  RoastStyle,
} from '../types';
import {
  BAG_SIZES,
  ROAST_STYLES,
  createBlendComponent,
  formatRoastStyle,
  originFieldLabel,
  originFieldPlaceholder,
  validateNewBean,
} from '../utils/beans';
import { createPhotoObjectUrl, revokePhotoObjectUrl } from '../utils/photos';
import { BlendCompositionEditor } from './BlendCompositionEditor';
import { LabelScanButton } from './LabelScanButton';
import { PhotoGalleryEditable } from './PhotoGalleryEditable';
import { PhotoUpload } from './PhotoUpload';

interface AddBeanFormProps {
  onAddBean: (payload: AddBeanPayload) => void;
}

interface PendingPhoto extends PhotoBlobInput {
  previewUrl: string;
}

interface BeanFormState {
  name: string;
  roaster: string;
  kind: BeanKind;
  originOrBlend: string;
  roastStyle: RoastStyle;
  blendComponents: BlendComponent[];
  roastDate: string;
  purchaseDate: string;
  bagSize: BagSize;
  tastingNotes: string;
}

const defaultFormState = (): BeanFormState => ({
  name: '',
  roaster: '',
  kind: 'single_origin',
  originOrBlend: '',
  roastStyle: 'medium',
  blendComponents: [],
  roastDate: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  bagSize: '250g',
  tastingNotes: '',
});

function clearPendingPhotos(pending: PendingPhoto[]) {
  for (const item of pending) {
    revokePhotoObjectUrl(item.previewUrl);
  }
}

export function AddBeanForm({ onAddBean }: AddBeanFormProps) {
  const [form, setForm] = useState(defaultFormState);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [scanWarnings, setScanWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pendingPhotosRef = useRef(pendingPhotos);
  pendingPhotosRef.current = pendingPhotos;

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

  const applyDraft = (draft: BeanDraft, warnings: string[]) => {
    setScanWarnings(warnings);
    setForm((current) => ({
      ...current,
      name: draft.name ?? current.name,
      roaster: draft.roaster ?? current.roaster,
      kind: draft.kind ?? current.kind,
      originOrBlend: draft.originOrBlend ?? current.originOrBlend,
      roastStyle: draft.roastStyle ?? current.roastStyle,
      roastDate: draft.roastDate ?? current.roastDate,
      purchaseDate: draft.purchaseDate ?? current.purchaseDate,
      bagSize: draft.bagSize ?? current.bagSize,
      tastingNotes: draft.tastingNotes ?? current.tastingNotes,
      blendComponents:
        draft.kind === 'blend' && draft.blendComponents
          ? draft.blendComponents.map((c) =>
              createBlendComponent(c.name ?? '', c.percent ?? 0),
            )
          : current.blendComponents,
    }));
  };

  const handleKindChange = (kind: BeanKind) => {
    setForm((f) => ({
      ...f,
      kind,
      blendComponents:
        kind === 'blend'
          ? f.blendComponents.length > 0
            ? f.blendComponents
            : [createBlendComponent(), createBlendComponent()]
          : [],
    }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const validation = validateNewBean({
      ...form,
      photos: pendingPhotos.map((p) => p.photo),
    });

    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    onAddBean({
      bean: validation.bean,
      photoBlobs: pendingPhotos.map(({ photo, blob }) => ({ photo, blob })),
    });

    clearPendingPhotos(pendingPhotos);
    setPendingPhotos([]);
    setScanWarnings([]);
    setForm(defaultFormState());
  };

  const pendingDisplay = pendingPhotos.map(({ photo, previewUrl }) => ({
    photo,
    url: previewUrl,
  }));

  const firstBlob = pendingPhotos[0]?.blob ?? null;

  return (
    <section className="panel" aria-labelledby="add-bean-heading">
      <h2 id="add-bean-heading">Add a bean</h2>
      <p className="panel__intro">
        Enter bag details manually or scan a label photo (requires local API key — demo only).
      </p>
      <form className="shot-form bean-form" onSubmit={handleSubmit} noValidate>
        <PhotoUpload
          existingCount={pendingPhotos.length}
          onPhotosAdded={handlePhotosAdded}
          label="Label / bag photos"
        />
        <PhotoGalleryEditable
          items={pendingDisplay}
          label="Photos to attach"
          onRemove={handleRemovePending}
        />
        <LabelScanButton imageBlob={firstBlob} onDraft={applyDraft} />

        {scanWarnings.length > 0 && (
          <ul className="scan-warnings" aria-live="polite">
            {scanWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}

        <div className="form-row form-row--pair">
          <div>
            <label htmlFor="beanName">Name</label>
            <input
              id="beanName"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="beanRoaster">Roaster</label>
            <input
              id="beanRoaster"
              value={form.roaster}
              onChange={(e) => setForm((f) => ({ ...f, roaster: e.target.value }))}
              required
            />
          </div>
        </div>

        <fieldset className="kind-fieldset">
          <legend>Kind</legend>
          <label>
            <input
              type="radio"
              name="bean-kind"
              checked={form.kind === 'single_origin'}
              onChange={() => handleKindChange('single_origin')}
            />
            Single origin
          </label>
          <label>
            <input
              type="radio"
              name="bean-kind"
              checked={form.kind === 'blend'}
              onChange={() => handleKindChange('blend')}
            />
            Blend
          </label>
        </fieldset>

        <div className="form-row">
          <label htmlFor="beanRoastStyle">Roast style</label>
          <select
            id="beanRoastStyle"
            value={form.roastStyle}
            onChange={(e) =>
              setForm((f) => ({ ...f, roastStyle: e.target.value as RoastStyle }))
            }
          >
            {ROAST_STYLES.map((style) => (
              <option key={style} value={style}>
                {formatRoastStyle(style)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="beanOrigin">{originFieldLabel(form.kind)}</label>
          <input
            id="beanOrigin"
            value={form.originOrBlend}
            placeholder={originFieldPlaceholder(form.kind)}
            onChange={(e) => setForm((f) => ({ ...f, originOrBlend: e.target.value }))}
            required
          />
        </div>

        {form.kind === 'blend' && (
          <BlendCompositionEditor
            components={form.blendComponents}
            onChange={(blendComponents) => setForm((f) => ({ ...f, blendComponents }))}
          />
        )}

        <div className="form-row form-row--triple">
          <div>
            <label htmlFor="beanRoastDate">Roast date</label>
            <input
              id="beanRoastDate"
              type="date"
              value={form.roastDate}
              onChange={(e) => setForm((f) => ({ ...f, roastDate: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="beanPurchaseDate">Purchased</label>
            <input
              id="beanPurchaseDate"
              type="date"
              value={form.purchaseDate}
              onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="beanBagSize">Bag size</label>
            <select
              id="beanBagSize"
              value={form.bagSize}
              onChange={(e) =>
                setForm((f) => ({ ...f, bagSize: e.target.value as BagSize }))
              }
            >
              {BAG_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="beanTastingNotes">Tasting notes</label>
          <textarea
            id="beanTastingNotes"
            rows={3}
            value={form.tastingNotes}
            onChange={(e) => setForm((f) => ({ ...f, tastingNotes: e.target.value }))}
          />
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary">
          Add bean
        </button>
      </form>
      <p className="security-footnote">
        Label scanning uses your API key in the browser (demo only). A secure backend proxy is
        planned — see GitHub issues labeled <strong>security</strong>.
      </p>
    </section>
  );
}
