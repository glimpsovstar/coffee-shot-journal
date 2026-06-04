import type { PhotoDisplay } from '../types';

interface PhotoGalleryProps {
  items: PhotoDisplay[];
  label?: string;
}

export function PhotoGallery({ items, label = 'Photos' }: PhotoGalleryProps) {
  if (items.length === 0) return null;

  return (
    <div className="photo-gallery" aria-label={label}>
      <ul className="photo-gallery__list">
        {items.map(({ photo, url }) => (
          <li key={photo.id}>
            <img
              className="photo-thumb"
              src={url}
              alt={photo.fileName}
              loading="lazy"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
