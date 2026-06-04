import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createMockImageFile } from '../test/fixtures';
import { PhotoUpload } from './PhotoUpload';

describe('PhotoUpload', () => {
  it('calls onPhotosAdded when valid files are selected', async () => {
    const user = userEvent.setup();
    const onPhotosAdded = vi.fn();

    render(<PhotoUpload existingCount={0} onPhotosAdded={onPhotosAdded} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createMockImageFile();
    await user.upload(input, file);

    await waitFor(() => {
      expect(onPhotosAdded).toHaveBeenCalledOnce();
    });
    expect(onPhotosAdded.mock.calls[0]?.[0]).toHaveLength(1);
  });

  it('shows error for unsupported file types', async () => {
    const onPhotosAdded = vi.fn();

    render(<PhotoUpload existingCount={0} onPhotosAdded={onPhotosAdded} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createMockImageFile('doc.pdf', 'application/pdf', 64);
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(/not a supported image type/);
    expect(onPhotosAdded).not.toHaveBeenCalled();
  });
});
