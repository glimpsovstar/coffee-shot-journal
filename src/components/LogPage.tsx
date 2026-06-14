import { AddShotForm } from './AddShotForm';
import { SegmentedControl } from './SegmentedControl';
import { BeanCatalogue } from './BeanCatalogue';
import { CafeCatalogue } from './CafeCatalogue';
import { ImportShotForm } from './ImportShotForm';
import type {
  AddBeanPayload,
  AddCafeVisitPayload,
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
  onAddShot: (payload: AddShotPayload) => Promise<void>;
  onAddBean: (payload: AddBeanPayload) => void;
  onAddVisit: (payload: AddCafeVisitPayload) => Promise<Cafe>;
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
  onAddVisit,
  onAddBeanPhotos,
  onRemoveBeanPhoto,
  onAddCafePhotos: _onAddCafePhotos,
  onRemoveCafePhoto: _onRemoveCafePhoto,
}: LogPageProps) {
  return (
    <div className="log-page">
      <header className="log-page__header">
        <h2 className="log-page__title">Log</h2>
        <p className="log-page__intro">
          Home espresso shots, café visits and coffees, and your bean catalogue.
        </p>
      </header>

      <SegmentedControl
        label="Log options"
        scrollable
        options={LOG_SECTIONS.map((section) => ({ value: section.id, label: section.label }))}
        value={section}
        onChange={onSectionChange}
        className="log-page__sections"
      />

      {section === 'shot' ? (
        <AddShotForm beans={beans} onAddShot={onAddShot} />
      ) : section === 'cafes' ? (
        <CafeCatalogue
          cafes={cafes}
          shots={shots}
          beans={beans}
          resolvePhotos={resolvePhotos}
          onAddVisit={onAddVisit}
          onAddShot={onAddShot}
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
