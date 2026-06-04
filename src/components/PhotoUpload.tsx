import { useRef, useState, type ChangeEvent } from 'react';
import type { PhotoBlobInput } from '../types';
import { filesToPhotos, MAX_PHOTO_SIZE_LABEL, validateImageFiles } from '../utils/photos';

interface PhotoUploadProps {
  existingCount: number;
  onPhotosAdded: (inputs: PhotoBlobInput[]) => void;
  label?: string;
}

export function PhotoUpload({
  existingCount,
  onPhotosAdded,
  label = 'Add photos',
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const validation = validateImageFiles(fileList, existingCount);
    if (!validation.ok) {
      setError(validation.error);
      event.target.value = '';
      return;
    }

    try {
      const inputs = await filesToPhotos(validation.files);
      onPhotosAdded(inputs);
    } catch {
      setError('Could not read one or more images.');
    }

    event.target.value = '';
  };

  return (
    <div className="photo-upload">
      <label className="photo-upload__label">
        {label}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="photo-upload__input"
          onChange={handleChange}
        />
      </label>
      <p className="photo-upload__hint">
        Up to 5 photos, {MAX_PHOTO_SIZE_LABEL} each (JPEG, PNG, WebP, HEIC)
      </p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
