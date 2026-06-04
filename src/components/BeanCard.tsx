import type { Bean } from '../types';
import { formatRoastDate } from '../utils/shots';

interface BeanCardProps {
  bean: Bean;
}

export function BeanCard({ bean }: BeanCardProps) {
  return (
    <article className="card bean-card">
      <h3 className="card__title">{bean.name}</h3>
      <dl className="detail-list">
        <div>
          <dt>Roaster</dt>
          <dd>{bean.roaster}</dd>
        </div>
        <div>
          <dt>Origin / blend</dt>
          <dd>{bean.originOrBlend}</dd>
        </div>
        <div>
          <dt>Roast date</dt>
          <dd>{formatRoastDate(bean.roastDate)}</dd>
        </div>
        <div>
          <dt>Tasting notes</dt>
          <dd>{bean.tastingNotes}</dd>
        </div>
      </dl>
    </article>
  );
}
