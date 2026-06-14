import { FloatingShotHero } from './FloatingShotHero';
import { MagneticButton } from './MagneticButton';
import type { Bean, Shot } from '../types';
import type { PhotoDisplay } from '../types';
import { getRecentExtractionPhotos } from '../utils/analytics';

interface JournalHeroProps {
  shots: Shot[];
  beans: Bean[];
  shotCount: number;
  homeShotCount: number;
  cafeShotCount: number;
  currentBeanLabel?: string;
  resolvePhotos: (photos: Shot['photos']) => PhotoDisplay[];
  onLogClick: () => void;
}

export function JournalHero({
  shots,
  beans,
  shotCount,
  homeShotCount,
  cafeShotCount,
  currentBeanLabel,
  resolvePhotos,
  onLogClick,
}: JournalHeroProps) {
  const hasPhotoWave = getRecentExtractionPhotos(shots).length > 0;

  const logCta = (
    <MagneticButton type="button" className="btn-primary journal-hero__cta" onClick={onLogClick}>
      Log a shot
    </MagneticButton>
  );

  return (
    <section className="journal-hero" aria-label="Journal highlights">
      <div className="journal-hero__stage">
        {hasPhotoWave ? (
          <FloatingShotHero
            shots={shots}
            beans={beans}
            resolvePhotos={resolvePhotos}
            immersive
            scrollerOverlay={logCta}
          />
        ) : (
          <div className="journal-hero__empty">
            <h2 className="journal-hero__empty-title">Your extraction wave</h2>
            <p className="journal-hero__empty-text">
              Add a cup or puck photo when you log — your shots will stack here in a floating gallery.
            </p>
            {logCta}
          </div>
        )}
      </div>

      <div className="journal-hero__meta">
        <div className="journal-hero__stats" aria-label="Journal summary">
          <span className="journal-hero__stat">
            <strong>{shotCount}</strong> shot{shotCount === 1 ? '' : 's'}
          </span>
          <span className="journal-hero__stat-divider" aria-hidden="true">·</span>
          <span className="journal-hero__stat">
            <strong>{homeShotCount}</strong> home
          </span>
          <span className="journal-hero__stat-divider" aria-hidden="true">·</span>
          <span className="journal-hero__stat">
            <strong>{cafeShotCount}</strong> café
          </span>
        </div>

        {currentBeanLabel ? (
          <p className="journal-hero__latest">
            Latest shot: <strong>{currentBeanLabel}</strong>
          </p>
        ) : null}
      </div>
    </section>
  );
}
