import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { mockBeans } from '../test/fixtures';
import { CafeCatalogue } from './CafeCatalogue';

const mockCafe = {
  id: 'cafe-1',
  name: 'Allpress Coffee',
  address: '266 Ponsonby Road',
  latitude: -36.85,
  longitude: 174.75,
  notes: '',
  photos: [],
};

describe('CafeCatalogue', () => {
  it('shows prominent log new visit control when cafés exist', async () => {
    const user = userEvent.setup();

    render(
      <CafeCatalogue
        cafes={[mockCafe]}
        shots={[]}
        beans={mockBeans}
        resolvePhotos={() => []}
        onAddVisit={vi.fn().mockResolvedValue(mockCafe)}
        onAddShot={vi.fn()}
      />,
    );

    const newVisitButton = screen.getByRole('button', { name: 'Log new café visit' });
    expect(newVisitButton).toBeInTheDocument();
    expect(newVisitButton.className).toContain('btn-primary');

    await user.click(newVisitButton);

    expect(screen.getByRole('heading', { name: 'Log a café visit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save visit' })).toBeInTheDocument();
  });

  it('shows first-visit form when no cafés yet', () => {
    render(
      <CafeCatalogue
        cafes={[]}
        shots={[]}
        beans={mockBeans}
        resolvePhotos={() => []}
        onAddVisit={vi.fn().mockResolvedValue(mockCafe)}
        onAddShot={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Log new café visit' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Log a café visit' })).toBeInTheDocument();
  });
});
