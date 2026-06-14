import type { AddShotPayload, Bean, Cafe, PhotoDisplay, Shot } from '../types';
import { resolveShotPhotoDisplay } from '../utils/shotPhotoDisplay';
import { getShotsForCafe } from '../utils/shots';
import { CafeMapEmbed } from './CafeMapEmbed';
import { LogCafeCoffeeForm } from './LogCafeCoffeeForm';
import { PhotoGallery } from './PhotoGallery';
import { ShotCard } from './ShotCard';

interface CafeDetailProps {
  cafe: Cafe;
  shots: Shot[];
  beans: Bean[];
  resolvePhotos: (photos: Shot['photos']) => PhotoDisplay[];
  onAddCoffee: (payload: AddShotPayload) => Promise<void>;
}

export function CafeDetail({ cafe, shots, beans, resolvePhotos, onAddCoffee }: CafeDetailProps) {
  const cafeShots = getShotsForCafe(shots, cafe.id);

  return (
    <article className="panel cafe-detail">
      <header className="cafe-detail__header">
        <h3 className="cafe-detail__title">{cafe.name}</h3>
        {cafe.address ? <p className="cafe-detail__address">{cafe.address}</p> : null}
      </header>

      <CafeMapEmbed
        name={cafe.name}
        latitude={cafe.latitude}
        longitude={cafe.longitude}
        googlePlaceId={cafe.googlePlaceId}
      />

      <LogCafeCoffeeForm cafe={cafe} beans={beans} onAddCoffee={onAddCoffee} />

      {cafe.notes ? <p className="cafe-detail__notes">{cafe.notes}</p> : null}

      <PhotoGallery items={resolvePhotos(cafe.photos)} label="Café photos" />

      <section aria-labelledby={`cafe-shots-${cafe.id}`}>
        <h4 id={`cafe-shots-${cafe.id}`} className="cafe-detail__shots-heading">
          Coffees logged here ({cafeShots.length})
        </h4>
        {cafeShots.length === 0 ? (
          <p className="empty-state">
            No coffees logged yet — pick a drink in the form above and tap Log coffee.
          </p>
        ) : (
          <ul className="card-list">
            {cafeShots.map((shot) => (
              <li key={shot.id}>
                <ShotCard
                  shot={shot}
                  beans={beans}
                  cafes={[cafe]}
                  photoItems={resolveShotPhotoDisplay(shot, [cafe], resolvePhotos)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
