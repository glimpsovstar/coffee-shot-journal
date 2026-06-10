import { AddShotForm } from './AddShotForm';
import { BeanCatalogue } from './BeanCatalogue';
import { ImportShotForm } from './ImportShotForm';
import type {
  AddBeanPayload,
  AddShotPayload,
  Bean,
  PhotoBlobInput,
  PhotoDisplay,
  Shot,
} from '../types';

export type LogSection = 'shot' | 'import' | 'beans';

interface LogPageProps {
  section: LogSection;
  onSectionChange: (section: LogSection) => void;
  beans: Bean[];
  resolvePhotos: (photos: Shot['photos']) => PhotoDisplay[];
  onAddShot: (payload: AddShotPayload) => void;
  onAddBean: (payload: AddBeanPayload) => void;
  onAddBeanPhotos: (beanId: string, inputs: PhotoBlobInput[]) => void;
  onRemoveBeanPhoto: (beanId: string, photoId: string) => void;
}

const LOG_SECTIONS: { id: LogSection; label: string }[] = [
  { id: 'shot', label: 'New shot' },
  { id: 'import', label: 'Import past shot' },
  { id: 'beans', label: 'Beans' },
];

export function LogPage({
  section,
  onSectionChange,
  beans,
  resolvePhotos,
  onAddShot,
  onAddBean,
  onAddBeanPhotos,
  onRemoveBeanPhoto,
}: LogPageProps) {
  return (
    <div className="log-page">
      <header className="log-page__header">
        <h2 className="log-page__title">Log</h2>
        <p className="log-page__intro">Add shots, import from a photo, or manage your bean catalogue.</p>
      </header>

      <nav className="app-nav app-nav--secondary" aria-label="Log options">
        {LOG_SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={
              section === id ? 'app-nav__link app-nav__link--active' : 'app-nav__link'
            }
            aria-current={section === id ? 'true' : undefined}
            onClick={() => onSectionChange(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {section === 'shot' ? (
        <AddShotForm beans={beans} onAddShot={onAddShot} />
      ) : section === 'import' ? (
        <ImportShotForm beans={beans} onImportShot={onAddShot} />
      ) : (
        <BeanCatalogue
          beans={beans}
          resolvePhotos={resolvePhotos}
          onAddBean={onAddBean}
          onAddBeanPhotos={onAddBeanPhotos}
          onRemoveBeanPhoto={onRemoveBeanPhoto}
        />
      )}
    </div>
  );
}
