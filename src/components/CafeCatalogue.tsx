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

interface CafeCatalogueProps {
  cafes: Cafe[];
  shots: Shot[];
  beans: Bean[];
  resolvePhotos: (photos: Cafe['photos']) => PhotoDisplay[];
  onAddCafe: (payload: AddCafePayload) => Promise<Cafe>;
  onAddShot: (payload: AddShotPayload) => void;
  onAddCafePhotos: (cafeId: string, inputs: PhotoBlobInput[]) => void;
  onRemoveCafePhoto: (cafeId: string, photoId: string) => void;
}

function scrollToLogCoffee(cafeId: string) {
  requestAnimationFrame(() => {
    document.getElementById(`log-coffee-${cafeId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  });
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
    if (selectedId && cafes.some((c) => c.id === selectedId)) return;
    setSelectedId(cafes[0]?.id ?? null);
  }, [cafes, selectedId]);

  const handleSelectCafe = (cafeId: string) => {
    setSelectedId(cafeId);
    scrollToLogCoffee(cafeId);
  };

  const handleAddCafe = async (payload: AddCafePayload) => {
    const cafe = await onAddCafe(payload);
    setSelectedId(cafe.id);
    scrollToLogCoffee(cafe.id);
    return cafe;
  };

  return (
    <div className="cafe-catalogue">
      {cafes.length > 0 ? (
        <section className="panel cafe-catalogue__picker" aria-labelledby="cafe-catalogue-heading">
          <h2 id="cafe-catalogue-heading">Log coffees at a café</h2>
          <p className="panel__intro">
            Pick where you went, then choose what you drank — flat white, latte, magic, and so on.
          </p>
          <ul className="cafe-picker">
            {cafes.map((cafe) => (
              <li key={cafe.id}>
                <button
                  type="button"
                  className={
                    selectedId === cafe.id
                      ? 'cafe-picker__option cafe-picker__option--active'
                      : 'cafe-picker__option'
                  }
                  aria-pressed={selectedId === cafe.id}
                  onClick={() => handleSelectCafe(cafe.id)}
                >
                  <span className="cafe-picker__name">{cafe.name}</span>
                  {cafe.address ? (
                    <span className="cafe-picker__meta">{cafe.address}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
      ) : cafes.length === 0 ? (
        <p className="empty-state panel">
          No cafés yet — add one below, then log the coffees you ordered there.
        </p>
      ) : null}

      <AddCafeForm onAddCafe={handleAddCafe} defaultCollapsed={cafes.length > 0} />
    </div>
  );
}
