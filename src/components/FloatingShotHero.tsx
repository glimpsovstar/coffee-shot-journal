import { useState } from 'react';
import type { Bean, PhotoDisplay, Shot } from '../types';
import { formatBeanChoiceLabel } from '../utils/beans';
import { formatHeroRecipeLine, getFeaturedShotWithPhoto } from '../utils/analytics';
import { formatBrewedAt, getBeanById } from '../utils/shots';

interface FloatingShotHeroProps {
  shots: Shot[];
  beans: Bean[];
  resolvePhotos: (photos: Shot['photos']) => PhotoDisplay[];
}

export function FloatingShotHero({ shots, beans, resolvePhotos }: FloatingShotHeroProps) {
  const [revealed, setRevealed] = useState(false);
  const featured = getFeaturedShotWithPhoto(shots);

  if (!featured) return null;

  const photoItems = resolvePhotos(featured.photos);
  const heroPhoto = photoItems[0];
  if (!heroPhoto) return null;

  const bean = getBeanById(beans, featured.beanId);
  const beanLabel = bean ? formatBeanChoiceLabel(bean) : 'Latest pull';
  const recipeLine = formatHeroRecipeLine(featured);

  const toggleReveal = () => setRevealed((value) => !value);

  return (
    <section
      className={`floating-hero${revealed ? ' floating-hero--revealed' : ''}`}
      aria-labelledby="floating-hero-heading"
    >
      <h2 id="floating-hero-heading" className="floating-hero__eyebrow">Latest extraction</h2>
      <button
        type="button"
        className="floating-hero__card"
        onClick={toggleReveal}
        aria-expanded={revealed}
        aria-label={`${beanLabel} — ${formatBrewedAt(featured.brewedAt)}. Tap to ${revealed ? 'hide' : 'show'} recipe.`}
      >
        <div className="floating-hero__media">
          <img
            src={heroPhoto.url}
            alt=""
            className="floating-hero__image"
            decoding="async"
          />
          {recipeLine ? (
            <div className="floating-hero__overlay" aria-hidden={!revealed}>
              <p className="floating-hero__bean">{beanLabel}</p>
              <p className="floating-hero__recipe">{recipeLine}</p>
            </div>
          ) : null}
        </div>
      </button>
      <p className="floating-hero__hint">Hover or tap the photo to reveal the recipe.</p>
    </section>
  );
}
