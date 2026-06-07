import type { AddBeanPayload, Bean, PhotoBlobInput, PhotoDisplay } from '../types';
import { AddBeanForm } from './AddBeanForm';
import { BeanCard } from './BeanCard';

interface BeanCatalogueProps {
  beans: Bean[];
  resolvePhotos: (photos: Bean['photos']) => PhotoDisplay[];
  onAddBean: (payload: AddBeanPayload) => void | Promise<void>;
  onAddBeanPhotos: (beanId: string, inputs: PhotoBlobInput[]) => void | Promise<void>;
  onRemoveBeanPhoto: (beanId: string, photoId: string) => void | Promise<void>;
}

export function BeanCatalogue({
  beans,
  resolvePhotos,
  onAddBean,
  onAddBeanPhotos,
  onRemoveBeanPhoto,
}: BeanCatalogueProps) {
  return (
    <>
      <AddBeanForm onAddBean={onAddBean} />
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
    </>
  );
}
