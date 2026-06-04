import type { Bean, PhotoBlobInput, PhotoDisplay } from '../types';
import { formatRoastDate } from '../utils/shots';
import { PhotoGalleryEditable } from './PhotoGalleryEditable';
import { PhotoUpload } from './PhotoUpload';

interface BeanCardProps {
  bean: Bean;
  photoItems: PhotoDisplay[];
  onAddPhotos: (beanId: string, inputs: PhotoBlobInput[]) => void;
  onRemovePhoto: (beanId: string, photoId: string) => void;
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
