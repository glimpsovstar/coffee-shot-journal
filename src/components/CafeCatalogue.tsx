import { useEffect, useState } from 'react';
import type {
  AddCafeVisitPayload,
  AddShotPayload,
  Bean,
  Cafe,
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
  onAddVisit: (payload: AddCafeVisitPayload) => Promise<Cafe>;
  onAddShot: (payload: AddShotPayload) => Promise<void>;
}

function scrollElementIntoView(elementId: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(elementId);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

function scrollToLogCoffee(cafeId: string) {
  scrollElementIntoView(`log-coffee-${cafeId}`);
}

export function CafeCatalogue({
  cafes,
  shots,
  beans,
  resolvePhotos,
  onAddVisit,
  onAddShot,
}: CafeCatalogueProps) {
  const [selectedId, setSelectedId] = useState<string | null>(cafes[0]?.id ?? null);
  const [newVisitOpen, setNewVisitOpen] = useState(false);
  const selected = cafes.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId && cafes.some((c) => c.id === selectedId)) return;
    setSelectedId(cafes[0]?.id ?? null);
  }, [cafes, selectedId]);

  const handleSelectCafe = (cafeId: string) => {
    setSelectedId(cafeId);
    setNewVisitOpen(false);
    scrollToLogCoffee(cafeId);
  };

  const handleAddVisit = async (payload: AddCafeVisitPayload) => {
    const cafe = await onAddVisit(payload);
    setSelectedId(cafe.id);
    setNewVisitOpen(false);
    scrollToLogCoffee(cafe.id);
    return cafe;
  };

  const openNewVisit = () => {
    setNewVisitOpen(true);
    scrollElementIntoView('new-cafe-visit-form');
  };

  return (
    <div className="cafe-catalogue">
      {cafes.length > 0 ? (
        <section className="panel cafe-catalogue__picker" aria-labelledby="cafe-catalogue-heading">
          <header className="cafe-catalogue__picker-header">
            <div>
              <h2 id="cafe-catalogue-heading">Your cafés</h2>
              <p className="panel__intro">
                Pick a café to log another coffee, or start a visit at a new place.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary cafe-catalogue__new-visit"
              onClick={openNewVisit}
            >
              Log new café visit
            </button>
          </header>
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

      {cafes.length > 0 && newVisitOpen ? (
        <AddCafeForm
          id="new-cafe-visit-form"
          beans={beans}
          onAddVisit={handleAddVisit}
          expanded
          onExpandedChange={setNewVisitOpen}
        />
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
          No cafés yet — log your first visit below with the café and the coffee you ordered.
        </p>
      ) : null}

      {cafes.length === 0 ? (
        <AddCafeForm beans={beans} onAddVisit={handleAddVisit} />
      ) : null}
    </div>
  );
}
