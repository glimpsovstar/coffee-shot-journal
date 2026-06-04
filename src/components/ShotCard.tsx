import type { Bean, Shot } from '../types';
import { formatBrewedAt, getBeanById, ratio } from '../utils/shots';
import { StarRating } from './StarRating';

interface ShotCardProps {
  shot: Shot;
  beans: Bean[];
}

export function ShotCard({ shot, beans }: ShotCardProps) {
  const bean = getBeanById(beans, shot.beanId);
  const beanName = bean?.name ?? 'Unknown bean';

  return (
    <article className="card shot-card">
      <header className="shot-card__header">
        <div>
          <h3 className="card__title">{beanName}</h3>
          <time className="shot-card__time" dateTime={shot.brewedAt}>
            {formatBrewedAt(shot.brewedAt)}
          </time>
        </div>
        <StarRating value={shot.rating} />
      </header>
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
