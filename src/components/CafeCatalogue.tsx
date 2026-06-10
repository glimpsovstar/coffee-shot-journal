import { useEffect, useState } from 'react';
import type {
  AddCafePayload,
  AddShotPayload,
  Bean,
  Cafe,
  PhotoBlobInput,
  PhotoDisplay,
  Shot,
} from '../types';
import { AddCafeForm } from './AddCafeForm';
import { CafeDetail } from './CafeDetail';
import { PhotoGallery } from './PhotoGallery';

interface CafeCatalogueProps {
  cafes: Cafe[];
  shots: Shot[];
  beans: Bean[];
  resolvePhotos: (photos: Cafe['photos']) => PhotoDisplay[];
  onAddCafe: (payload: AddCafePayload) => void | Promise<void>;
  onAddShot: (payload: AddShotPayload) => void;
  onAddCafePhotos: (cafeId: string, inputs: PhotoBlobInput[]) => void;
  onRemoveCafePhoto: (cafeId: string, photoId: string) => void;
}

export function CafeCatalogue({
  cafes,
  shots,
  beans,
  resolvePhotos,
  onAddCafe,
  onAddShot,
}: CafeCatalogueProps) {
  const [selectedId, setSelectedId] = useState<string | null>(cafes[0]?.id ?? null);
  const selected = cafes.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) return;
    const detail = document.getElementById(`cafe-detail-${selectedId}`);
    detail?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedId]);

  return (
    <>
      <AddCafeForm onAddCafe={onAddCafe} />
      <section className="panel" aria-labelledby="cafe-catalogue-heading">
        <h2 id="cafe-catalogue-heading">Your cafés</h2>
        <p className="panel__intro">
          Places you visit — open one to log a coffee, see the map, and review past orders.
        </p>
        {cafes.length === 0 ? (
          <p className="empty-state">No cafés yet. Add one above.</p>
        ) : (
          <ul className="card-list cafe-list">
            {cafes.map((cafe) => (
              <li key={cafe.id}>
                <button
                  type="button"
                  className={`cafe-list__item${selectedId === cafe.id ? ' cafe-list__item--active' : ''}`}
                  onClick={() => setSelectedId(cafe.id)}
                >
                  <span className="cafe-list__name">{cafe.name}</span>
                  {cafe.address ? (
                    <span className="cafe-list__meta">{cafe.address}</span>
                  ) : null}
                  {cafe.photos.length > 0 ? (
                    <PhotoGallery
                      items={resolvePhotos(cafe.photos).slice(0, 1)}
                      label=""
                    />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {selected ? (
        <div id={`cafe-detail-${selected.id}`} className="cafe-catalogue__detail">
          <CafeDetail
            cafe={selected}
            shots={shots}
            beans={beans}
            resolvePhotos={resolvePhotos}
            onAddCoffee={onAddShot}
          />
        </div>
      ) : null}
    </>
  );
}
