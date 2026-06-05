import type { Bean, PhotoBlobInput, PhotoDisplay } from '../types';
import { formatBlendSummary, formatRoastStyle, originFieldLabel } from '../utils/beans';
import { formatRoastDate } from '../utils/shots';
import { PhotoGalleryEditable } from './PhotoGalleryEditable';
import { PhotoUpload } from './PhotoUpload';

interface BeanCardProps {
  bean: Bean;
  photoItems: PhotoDisplay[];
  onAddPhotos: (beanId: string, inputs: PhotoBlobInput[]) => Promise<void> | void;
  onRemovePhoto: (beanId: string, photoId: string) => Promise<void> | void;
}

export function BeanCard({
  bean,
  photoItems,
  onAddPhotos,
  onRemovePhoto,
}: BeanCardProps) {
  return (
    <article className="card bean-card">
      <h3 className="card__title">{bean.name}</h3>
      <dl className="detail-list">
        <div>
          <dt>Roaster</dt>
          <dd>{bean.roaster}</dd>
        </div>
        <div>
          <dt>Kind</dt>
          <dd>{bean.kind === 'blend' ? 'Blend' : 'Single origin'}</dd>
        </div>
        <div>
          <dt>{originFieldLabel(bean.kind)}</dt>
          <dd>{bean.originOrBlend}</dd>
        </div>
        <div>
          <dt>Roast style</dt>
          <dd>{formatRoastStyle(bean.roastStyle)}</dd>
        </div>
        {bean.kind === 'blend' && bean.blendComponents.length > 0 && (
          <div>
            <dt>Blend breakdown</dt>
            <dd>{formatBlendSummary(bean.blendComponents)}</dd>
          </div>
        )}
        <div>
          <dt>Roast date</dt>
          <dd>{formatRoastDate(bean.roastDate)}</dd>
        </div>
        <div>
          <dt>Purchased</dt>
          <dd>{formatRoastDate(bean.purchaseDate)}</dd>
        </div>
        <div>
          <dt>Bag size</dt>
          <dd>{bean.bagSize}</dd>
        </div>
        <div>
          <dt>Tasting notes</dt>
          <dd>{bean.tastingNotes}</dd>
        </div>
      </dl>
      <PhotoGalleryEditable
        items={photoItems}
        label={`Photos for ${bean.name}`}
        onRemove={(photoId) => onRemovePhoto(bean.id, photoId)}
      />
      <PhotoUpload
        existingCount={bean.photos.length}
        onPhotosAdded={(inputs) => onAddPhotos(bean.id, inputs)}
        label="Add bean photos"
      />
    </article>
  );
}
