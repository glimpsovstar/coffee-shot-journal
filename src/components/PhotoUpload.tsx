import { useRef, useState, type ChangeEvent } from 'react';
import type { PhotoBlobInput } from '../types';
import {
  filesToPhotos,
  MAX_PHOTO_SIZE_LABEL,
  prepareImageFilesForUpload,
  validateImageFiles,
} from '../utils/photos';

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

  const clearPicker = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleInputClick = () => {
    setError(null);
    clearPicker();
  };

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const validation = validateImageFiles(fileList, existingCount);
    if (!validation.ok) {
      setError(validation.error);
      clearPicker();
      return;
    }

    const prepared = await prepareImageFilesForUpload(validation.files);
    if (!prepared.ok) {
      setError(prepared.error);
      clearPicker();
      return;
    }

    try {
      const inputs = await filesToPhotos(prepared.files);
      onPhotosAdded(inputs);
    } catch {
      setError('Could not read one or more images.');
    }

    clearPicker();
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
          onClick={handleInputClick}
          onChange={handleChange}
        />
      </label>
      <p className="photo-upload__hint">
        Up to 5 photos, {MAX_PHOTO_SIZE_LABEL} each (JPEG, PNG, WebP, HEIC). Large phone photos are
        compressed automatically when possible.
      </p>

      {error ? (
        <div className="photo-upload__error" role="alert">
          <p className="form-error">{error}</p>
          <button type="button" className="btn-ghost photo-upload__dismiss" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}
