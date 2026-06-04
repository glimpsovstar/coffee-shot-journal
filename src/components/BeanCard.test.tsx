import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createMockImageFile, mockBeans } from '../test/fixtures';
import { BeanCard } from './BeanCard';

describe('BeanCard', () => {
  it('invokes onAddPhotos when images are uploaded', async () => {
    const user = userEvent.setup();
    const onAddPhotos = vi.fn();
    const onRemovePhoto = vi.fn();

    render(
      <BeanCard
        bean={mockBeans[0]!}
        photoItems={[]}
        onAddPhotos={onAddPhotos}
        onRemovePhoto={onRemovePhoto}
      />,
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, createMockImageFile());

    await waitFor(() => {
      expect(onAddPhotos).toHaveBeenCalledWith('bean-a', expect.any(Array));
    });
  });

  it('invokes onRemovePhoto when remove is clicked', async () => {
    const user = userEvent.setup();
    const onAddPhotos = vi.fn();
    const onRemovePhoto = vi.fn();

    render(
      <BeanCard
        bean={{ ...mockBeans[0]!, photos: [{ id: 'p1', fileName: 'bag.jpg', mimeType: 'image/jpeg', createdAt: '' }] }}
        photoItems={[{ photo: { id: 'p1', fileName: 'bag.jpg', mimeType: 'image/jpeg', createdAt: '' }, url: 'blob:x' }]}
        onAddPhotos={onAddPhotos}
        onRemovePhoto={onRemovePhoto}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Remove bag.jpg/ }));

    expect(onRemovePhoto).toHaveBeenCalledWith('bean-a', 'p1');
  });
});
