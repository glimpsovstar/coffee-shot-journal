import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockPhoto } from '../test/fixtures';
import { PhotoGallery } from './PhotoGallery';

describe('PhotoGallery', () => {
  it('renders nothing when there are no items', () => {
    const { container } = render(<PhotoGallery items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders images with alt text from file names', () => {
    render(
      <PhotoGallery
        items={[{ photo: mockPhoto, url: 'blob:mock-url' }]}
        label="Shot photos"
      />,
    );

    expect(screen.getByRole('img', { name: 'puck.jpg' })).toHaveAttribute(
      'src',
      'blob:mock-url',
    );
  });
});
