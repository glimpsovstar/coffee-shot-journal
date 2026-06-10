import { AddShotForm } from './AddShotForm';
import { BeanCatalogue } from './BeanCatalogue';
import { CafeCatalogue } from './CafeCatalogue';
import { ImportShotForm } from './ImportShotForm';
import type {
  AddBeanPayload,
  AddCafePayload,
  AddShotPayload,
  Bean,
  Cafe,
  PhotoBlobInput,
  PhotoDisplay,
  Shot,
} from '../types';

export type LogSection = 'shot' | 'import' | 'beans' | 'cafes';

interface LogPageProps {
  section: LogSection;
  onSectionChange: (section: LogSection) => void;
  beans: Bean[];
  cafes: Cafe[];
  shots: Shot[];
  resolvePhotos: (photos: Shot['photos']) => PhotoDisplay[];
  onAddShot: (payload: AddShotPayload) => void;
  onAddBean: (payload: AddBeanPayload) => void;
  onAddCafe: (payload: AddCafePayload) => Promise<Cafe>;
  onAddBeanPhotos: (beanId: string, inputs: PhotoBlobInput[]) => void;
  onRemoveBeanPhoto: (beanId: string, photoId: string) => void;
  onAddCafePhotos: (cafeId: string, inputs: PhotoBlobInput[]) => void;
  onRemoveCafePhoto: (cafeId: string, photoId: string) => void;
}

const LOG_SECTIONS: { id: LogSection; label: string }[] = [
  { id: 'shot', label: 'Home shot' },
  { id: 'cafes', label: 'Café' },
  { id: 'beans', label: 'Beans' },
  { id: 'import', label: 'Import past shot' },
];

export function LogPage({
  section,
  onSectionChange,
  beans,
  cafes,
  shots,
  resolvePhotos,
  onAddShot,
  onAddBean,
  onAddCafe,
  onAddBeanPhotos,
  onRemoveBeanPhoto,
  onAddCafePhotos,
  onRemoveCafePhoto,
}: LogPageProps) {
  return (
    <div className="log-page">
      <header className="log-page__header">
        <h2 className="log-page__title">Log</h2>
        <p className="log-page__intro">
          Home espresso pulls, café visits and coffees, and your bean catalogue.
        </p>
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
      ) : section === 'cafes' ? (
        <CafeCatalogue
          cafes={cafes}
          shots={shots}
          beans={beans}
          resolvePhotos={resolvePhotos}
          onAddCafe={onAddCafe}
          onAddShot={onAddShot}
          onAddCafePhotos={onAddCafePhotos}
          onRemoveCafePhoto={onRemoveCafePhoto}
        />
      ) : section === 'beans' ? (
        <BeanCatalogue
          beans={beans}
          resolvePhotos={resolvePhotos}
          onAddBean={onAddBean}
          onAddBeanPhotos={onAddBeanPhotos}
          onRemoveBeanPhoto={onRemoveBeanPhoto}
        />
      ) : (
        <ImportShotForm beans={beans} onImportShot={onAddShot} />
      )}
    </div>
  );
}
