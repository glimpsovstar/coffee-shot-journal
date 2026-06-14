import type { Bean, Cafe, PhotoDisplay, Shot } from '../types';
import { formatDrinkSummary } from '../utils/drinks';
import {
  formatBrewedAt,
  getShotCardTitle,
  getShotLocationLabel,
  hasShotGrinder,
  hasShotRecipe,
  isCafeShot,
  isHomeShot,
  ratio,
} from '../utils/shots';
import { PhotoGallery } from './PhotoGallery';
import { ShotRecommendationPanel } from './ShotRecommendationPanel';
import { StarRating } from './StarRating';
import { WeatherDisplay } from './WeatherDisplay';

interface ShotCardProps {
  shot: Shot;
  beans: Bean[];
  cafes?: Cafe[];
  photoItems: PhotoDisplay[];
  size?: 'featured' | 'wide' | 'standard';
}

export function ShotCard({ shot, beans, cafes = [], photoItems, size = 'standard' }: ShotCardProps) {
  const title = getShotCardTitle(shot, beans, cafes);
  const drinkSummary = formatDrinkSummary(shot);
  const cafeShot = isCafeShot(shot);
  const heroPhoto = photoItems[0];
  const extraPhotos = photoItems.length > 1 ? photoItems.slice(1) : [];

  const chips: string[] = [];
  if (drinkSummary) chips.push(drinkSummary);
  if (hasShotRecipe(shot)) {
    chips.push(
      `${shot.doseIn}g → ${shot.yieldOut}g`,
      ratio(shot.doseIn, shot.yieldOut),
      `${shot.extractionTime}s`,
    );
  }
  if (cafeShot) chips.push('Café visit');

  const showSecondaryDetails =
    hasShotGrinder(shot) ||
    getShotLocationLabel(shot) ||
    shot.weather ||
    (shot.priceAud !== undefined && shot.priceAud > 0) ||
    shot.wouldOrderAgain !== undefined;

  return (
    <article className={`card shot-card tactile-surface shot-card--${size}`}>
      {size === 'featured' && heroPhoto ? (
        <div className="shot-card__banner">
          <img
            className="shot-card__banner-img"
            src={heroPhoto.url}
            alt={heroPhoto.photo.fileName}
            loading="lazy"
          />
          {photoItems.length > 1 ? (
            <span className="shot-card__thumb-count shot-card__thumb-count--banner">
              +{photoItems.length - 1}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="shot-card__layout">
        {heroPhoto && size !== 'featured' ? (
          <div className="shot-card__thumb-wrap">
            <img
              className="shot-card__thumb"
              src={heroPhoto.url}
              alt={heroPhoto.photo.fileName}
              loading="lazy"
            />
            {photoItems.length > 1 ? (
              <span className="shot-card__thumb-count">+{photoItems.length - 1}</span>
            ) : null}
          </div>
        ) : null}

        <div className="shot-card__body">
          <header className="shot-card__header">
            <div className="shot-card__title-block">
              <h3 className="card__title">{title}</h3>
              <time className="shot-card__time" dateTime={shot.brewedAt}>
                {formatBrewedAt(shot.brewedAt)}
              </time>
            </div>
            <StarRating value={shot.rating} />
          </header>

          {chips.length > 0 ? (
            <div className="shot-card__chips" aria-label="Shot summary">
              {chips.map((chip) => (
                <span key={chip} className="shot-card__chip">{chip}</span>
              ))}
            </div>
          ) : null}

          {shot.tastingNotes ? (
            <p className="shot-card__notes">{shot.tastingNotes}</p>
          ) : null}
        </div>
      </div>

      {extraPhotos.length > 0 ? (
        <PhotoGallery items={extraPhotos} label="More shot photos" />
      ) : null}

      {showSecondaryDetails ? (
        <dl className="detail-list detail-list--inline shot-card__details">
          {hasShotGrinder(shot) && (
            <div>
              <dt>Grinder</dt>
              <dd>
                {shot.grinder} · setting {shot.grindSetting}
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
        </dl>
      ) : null}

      {isHomeShot(shot) ? (
        <ShotRecommendationPanel shot={shot} beans={beans} photoItems={photoItems} />
      ) : null}
    </article>
  );
}
