import type { PhotoDisplay } from '../types';

interface PhotoGalleryEditableProps {
  items: PhotoDisplay[];
  label?: string;
  onRemove: (photoId: string) => void;
}

export function PhotoGalleryEditable({
  items,
  label = 'Photos',
  onRemove,
}: PhotoGalleryEditableProps) {
  if (items.length === 0) return null;

  return (
    <div className="photo-gallery photo-gallery--editable" aria-label={label}>
      <ul className="photo-gallery__list">
        {items.map(({ photo, url }) => (
          <li key={photo.id} className="photo-gallery__item">
            <img
              className="photo-thumb"
              src={url}
              alt={photo.fileName}
              loading="lazy"
            />
            <button
              type="button"
              className="photo-remove"
              onClick={() => onRemove(photo.id)}
              aria-label={`Remove ${photo.fileName}`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
