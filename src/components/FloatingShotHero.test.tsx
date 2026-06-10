import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockBeans } from '../test/fixtures';
import type { Shot } from '../types';
import { FloatingShotHero } from './FloatingShotHero';

const photo = {
  id: 'photo-hero',
  fileName: 'puck.jpg',
  mimeType: 'image/jpeg' as const,
  createdAt: '2026-06-04T10:00:00',
};

const shotWithPhoto: Shot = {
  id: 'shot-hero',
  beanId: 'bean-a',
  brewedAt: '2026-06-04T10:00:00',
  grinder: 'Niche',
  grindSetting: '15',
  doseIn: 15.5,
  yieldOut: 35,
  extractionTime: 19,
  tastingNotes: '',
  rating: 5,
  photos: [photo],
  weather: {
    temperatureC: 8.2,
    humidityPercent: 55,
    description: 'Clear',
    source: 'open-meteo',
    observedAt: '2026-06-04T10:00:00',
  },
};

describe('FloatingShotHero', () => {
  it('renders a gallery of recent extraction photos', () => {
    const older: Shot = {
      ...shotWithPhoto,
      id: 'shot-old',
      brewedAt: '2026-06-01T10:00:00',
      photos: [{ ...photo, id: 'photo-old' }],
    };
    const resolvePhotos = (photos: Shot['photos']) =>
      photos.map((p) => ({ photo: p, url: `blob:${p.id}` }));

    render(
      <FloatingShotHero
        shots={[older, shotWithPhoto]}
        beans={mockBeans}
        resolvePhotos={resolvePhotos}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Recent extractions' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Test Ethiopia/i })).toHaveLength(2);
    expect(screen.getByText(/Showing the last 2 extraction photos/)).toBeInTheDocument();
  });

  it('reveals recipe on tap for one card', async () => {
    const user = userEvent.setup();
    const resolvePhotos = () => [{ photo, url: 'blob:hero' }];

    render(
      <FloatingShotHero shots={[shotWithPhoto]} beans={mockBeans} resolvePhotos={resolvePhotos} />,
    );

    const card = screen.getByRole('button', { name: /Test Ethiopia/i });
    expect(card).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('15.5g in ➔ 35g out | 19s at 8.2°C')).toBeInTheDocument();

    await user.click(card);
    expect(card).toHaveAttribute('aria-expanded', 'true');
  });

  it('returns null when no shot has photos', () => {
    const { container } = render(
      <FloatingShotHero
        shots={[{ ...shotWithPhoto, photos: [] }]}
        beans={mockBeans}
        resolvePhotos={() => []}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
