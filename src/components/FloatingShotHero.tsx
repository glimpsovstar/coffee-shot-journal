import { useState, type CSSProperties } from 'react';
import type { Bean, PhotoDisplay, Shot } from '../types';
import { formatBeanChoiceLabel } from '../utils/beans';
import {
  formatHeroRecipeLine,
  getRecentExtractionPhotos,
} from '../utils/analytics';
import { getHeroCardLayout } from '../utils/floatingHeroLayout';
import { formatBrewedAt, getBeanById } from '../utils/shots';

interface FloatingShotHeroProps {
  shots: Shot[];
  beans: Bean[];
  resolvePhotos: (photos: Shot['photos']) => PhotoDisplay[];
}

function heroCardId(shotId: string, photoId: string): string {
  return `${shotId}:${photoId}`;
}

export function FloatingShotHero({ shots, beans, resolvePhotos }: FloatingShotHeroProps) {
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const recent = getRecentExtractionPhotos(shots);

  const cards = recent
    .map(({ shot, photo }) => {
      const display = resolvePhotos([photo])[0];
      if (!display) return null;
      const bean = getBeanById(beans, shot.beanId);
      const beanLabel = bean ? formatBeanChoiceLabel(bean) : 'Latest pull';
      const recipeLine = formatHeroRecipeLine(shot);
      return {
        id: heroCardId(shot.id, photo.id),
        shot,
        display,
        beanLabel,
        recipeLine,
      };
    })
    .filter((card): card is NonNullable<typeof card> => card !== null);

  if (cards.length === 0) return null;

  return (
    <section className="floating-hero" aria-labelledby="floating-hero-heading">
      <h2 id="floating-hero-heading" className="floating-hero__eyebrow">
        Recent extractions
      </h2>
      <div className="floating-hero__scroller">
        <div className="floating-hero__gallery">
        {cards.map((card, index) => {
          const isRevealed = revealedId === card.id;
          const layout = getHeroCardLayout(card.id, index);
          return (
            <button
              key={card.id}
              type="button"
              className={`floating-hero__card${isRevealed ? ' floating-hero__card--revealed' : ''}`}
              style={
                {
                  '--hero-delay': `${index * 0.35}s`,
                  '--hero-offset-y': `${layout.offsetYPercent}%`,
                  '--hero-overlap': layout.overlapFactor,
                  '--hero-rotate': `${layout.rotationDeg}deg`,
                  zIndex: layout.zIndex,
                } as CSSProperties
              }
              aria-expanded={isRevealed}
              aria-label={`${card.beanLabel} — ${formatBrewedAt(card.shot.brewedAt)}. Tap to ${isRevealed ? 'hide' : 'show'} recipe.`}
              onClick={() => setRevealedId(isRevealed ? null : card.id)}
            >
              <div className="floating-hero__media">
                <img
                  src={card.display.url}
                  alt=""
                  className="floating-hero__image"
                  decoding="async"
                />
                {card.recipeLine ? (
                  <div className="floating-hero__overlay" aria-hidden={!isRevealed}>
                    <p className="floating-hero__bean">{card.beanLabel}</p>
                    <p className="floating-hero__recipe">{card.recipeLine}</p>
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
        </div>
      </div>
      <p className="floating-hero__hint">
        Showing the last {cards.length} extraction photo{cards.length === 1 ? '' : 's'}. Hover or
        tap to reveal the recipe.
      </p>
    </section>
  );
}
