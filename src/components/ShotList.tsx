import type { Bean, PhotoDisplay, Shot } from '../types';
import { sortShotsNewestFirst } from '../utils/shots';
import { ShotCard } from './ShotCard';

interface ShotListProps {
  shots: Shot[];
  beans: Bean[];
  resolvePhotos: (photos: Shot['photos']) => PhotoDisplay[];
}

export function ShotList({ shots, beans, resolvePhotos }: ShotListProps) {
  const sorted = sortShotsNewestFirst(shots);

  return (
    <section className="panel" aria-labelledby="shot-list-heading">
      <h2 id="shot-list-heading">Espresso shots</h2>
      <p className="panel__intro">Newest first — track what changed between pulls.</p>
      {sorted.length === 0 ? (
        <p className="empty-state">No shots logged yet. Add your first shot below.</p>
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
