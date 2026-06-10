import type { Bean, PhotoDisplay, Shot } from '../types';
import { sortShotsNewestFirst } from '../utils/shots';
import { ShotCard } from './ShotCard';

interface ShotListProps {
  shots: Shot[];
  beans: Bean[];
  resolvePhotos: (photos: Shot['photos']) => PhotoDisplay[];
  /** Hide a shot already featured elsewhere (e.g. floating hero). */
  excludeShotId?: string;
  heading?: string;
  intro?: string;
  emptyMessage?: string;
}

export function ShotList({
  shots,
  beans,
  resolvePhotos,
  excludeShotId,
  heading = 'Espresso shots',
  intro = 'Newest first — track what changed between pulls.',
  emptyMessage = 'No shots logged yet. Add your first shot below.',
}: ShotListProps) {
  const sorted = sortShotsNewestFirst(shots).filter((shot) => shot.id !== excludeShotId);

  return (
    <section className="panel" aria-labelledby="shot-list-heading">
      <h2 id="shot-list-heading">{heading}</h2>
      <p className="panel__intro">{intro}</p>
      {sorted.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <ul className="card-list">
          {sorted.map((shot) => (
            <li key={shot.id}>
              <ShotCard
                shot={shot}
                beans={beans}
                photoItems={resolvePhotos(shot.photos)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
