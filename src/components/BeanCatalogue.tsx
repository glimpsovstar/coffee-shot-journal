import type { Bean, PhotoBlobInput, PhotoDisplay } from '../types';
import { BeanCard } from './BeanCard';

interface BeanCatalogueProps {
  beans: Bean[];
  resolvePhotos: (photos: Bean['photos']) => PhotoDisplay[];
  onAddBeanPhotos: (beanId: string, inputs: PhotoBlobInput[]) => void;
  onRemoveBeanPhoto: (beanId: string, photoId: string) => void;
}

export function BeanCatalogue({
  beans,
  resolvePhotos,
  onAddBeanPhotos,
  onRemoveBeanPhoto,
}: BeanCatalogueProps) {
  return (
    <section className="panel" aria-labelledby="bean-catalogue-heading">
      <h2 id="bean-catalogue-heading">Bean catalogue</h2>
      <p className="panel__intro">Reference beans for your shots — attach bag or label photos.</p>
      <ul className="card-list">
        {beans.map((bean) => (
          <li key={bean.id}>
            <BeanCard
              bean={bean}
              photoItems={resolvePhotos(bean.photos)}
              onAddPhotos={onAddBeanPhotos}
              onRemovePhoto={onRemoveBeanPhoto}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
