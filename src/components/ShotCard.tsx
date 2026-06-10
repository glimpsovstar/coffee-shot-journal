import type { Bean, Cafe, PhotoDisplay, Shot } from '../types';
import { formatDrinkSummary } from '../utils/drinks';
import {
  formatBrewedAt,
  getShotCardTitle,
  getShotLocationLabel,
  hasShotGrinder,
  hasShotRecipe,
  isCafeShot,
  ratio,
} from '../utils/shots';
import { PhotoGallery } from './PhotoGallery';
import { StarRating } from './StarRating';
import { WeatherDisplay } from './WeatherDisplay';

interface ShotCardProps {
  shot: Shot;
  beans: Bean[];
  cafes?: Cafe[];
  photoItems: PhotoDisplay[];
}

export function ShotCard({ shot, beans, cafes = [], photoItems }: ShotCardProps) {
  const title = getShotCardTitle(shot, beans, cafes);
  const drinkSummary = formatDrinkSummary(shot);
  const cafeShot = isCafeShot(shot);

  return (
    <article className="card shot-card">
      <header className="shot-card__header">
        <div>
          <h3 className="card__title">{title}</h3>
          {cafeShot ? (
            <span className="shot-card__badge">Café</span>
          ) : null}
          <time className="shot-card__time" dateTime={shot.brewedAt}>
            {formatBrewedAt(shot.brewedAt)}
          </time>
        </div>
        <StarRating value={shot.rating} />
      </header>
      <PhotoGallery items={photoItems} label="Shot photos" />
      <dl className="detail-list detail-list--inline">
        {drinkSummary ? (
          <div>
            <dt>Drink</dt>
            <dd>{drinkSummary}</dd>
          </div>
        ) : null}
        {hasShotGrinder(shot) && (
          <div>
            <dt>Grinder</dt>
            <dd>
              {shot.grinder} · setting {shot.grindSetting}
            </dd>
          </div>
        )}
        {hasShotRecipe(shot) && (
          <div>
            <dt>Recipe</dt>
            <dd>
              {shot.doseIn}g in → {shot.yieldOut}g out ({ratio(shot.doseIn, shot.yieldOut)}) ·{' '}
              {shot.extractionTime}s
            </dd>
          </div>
        )}
        {getShotLocationLabel(shot) && (
          <div>
            <dt>Suburb</dt>
            <dd>{getShotLocationLabel(shot)}</dd>
          </div>
        )}
        {shot.weather && (
          <div>
            <dt>Weather</dt>
            <dd>
              <WeatherDisplay weather={shot.weather} />
            </dd>
          </div>
        )}
        {shot.priceAud !== undefined && shot.priceAud > 0 ? (
          <div>
            <dt>Price</dt>
            <dd>${shot.priceAud.toFixed(2)}</dd>
          </div>
        ) : null}
        {shot.wouldOrderAgain !== undefined ? (
          <div>
            <dt>Order again?</dt>
            <dd>{shot.wouldOrderAgain ? 'Yes' : 'No'}</dd>
          </div>
        ) : null}
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
