import type { Bean, PhotoDisplay, Shot } from '../types';
import { formatBeanChoiceLabel } from '../utils/beans';
import { formatBrewedAt, getBeanById, ratio } from '../utils/shots';
import { PhotoGallery } from './PhotoGallery';
import { StarRating } from './StarRating';

interface ShotCardProps {
  shot: Shot;
  beans: Bean[];
  photoItems: PhotoDisplay[];
}

export function ShotCard({ shot, beans, photoItems }: ShotCardProps) {
  const bean = getBeanById(beans, shot.beanId);
  const beanLabel = bean ? formatBeanChoiceLabel(bean) : 'Unknown bean';

  return (
    <article className="card shot-card">
      <header className="shot-card__header">
        <div>
          <h3 className="card__title">{beanLabel}</h3>
          <time className="shot-card__time" dateTime={shot.brewedAt}>
            {formatBrewedAt(shot.brewedAt)}
          </time>
        </div>
        <StarRating value={shot.rating} />
      </header>
      <PhotoGallery items={photoItems} label="Shot photos" />
      <dl className="detail-list detail-list--inline">
        <div>
          <dt>Grinder</dt>
          <dd>
            {shot.grinder} · setting {shot.grindSetting}
          </dd>
        </div>
        <div>
          <dt>Recipe</dt>
          <dd>
            {shot.doseIn}g in → {shot.yieldOut}g out ({ratio(shot.doseIn, shot.yieldOut)}) ·{' '}
            {shot.extractionTime}s
          </dd>
        </div>
        {shot.brewedLocation && (
          <div>
            <dt>Location</dt>
            <dd>{shot.brewedLocation}</dd>
          </div>
        )}
        {shot.tastingNotes && (
          <div>
            <dt>Tasting notes</dt>
            <dd>{shot.tastingNotes}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}
