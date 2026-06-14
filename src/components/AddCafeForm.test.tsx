import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as weather from '../services/weather';
import { mockBeans, mockCafe } from '../test/fixtures';
import { AddCafeForm } from './AddCafeForm';

vi.mock('../services/weather', () => ({
  fetchWeatherAt: vi.fn(),
}));

vi.mock('./CafePlaceField', () => ({
  CafePlaceField: ({
    onNameChange,
    onAddressChange,
    onSelectPlace,
  }: {
    onNameChange: (v: string) => void;
    onAddressChange: (v: string) => void;
    onSelectPlace: (place: {
      placeId: string;
      name: string;
      address: string;
      latitude: number;
      longitude: number;
    } | null) => void;
  }) => (
  <div>
    <button
      type="button"
      onClick={() => {
        onNameChange(mockCafe.name);
        onAddressChange(mockCafe.address ?? '');
        onSelectPlace({
          placeId: mockCafe.googlePlaceId!,
          name: mockCafe.name,
          address: mockCafe.address ?? '',
          latitude: mockCafe.latitude,
          longitude: mockCafe.longitude,
        });
      }}
    >
      Pick test café
    </button>
  </div>
  ),
}));

describe('AddCafeForm', () => {
  afterEach(() => {
    vi.mocked(weather.fetchWeatherAt).mockReset();
  });

  it('shows map preview when a place with coordinates is selected', async () => {
    const user = userEvent.setup();

    render(
      <AddCafeForm
        beans={mockBeans}
        cafes={[]}
        shots={[]}
        onAddVisit={vi.fn().mockResolvedValue(mockCafe)}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Pick test café' }));

    expect(screen.getByTitle(`Map of ${mockCafe.name}`)).toBeInTheDocument();
  });

  it('shows Open in Google Maps with place id after a successful save', async () => {
    const user = userEvent.setup();
    const savedCafe = { ...mockCafe, id: 'cafe-new' };
    vi.mocked(weather.fetchWeatherAt).mockResolvedValue({
      temperatureC: 18,
      humidityPercent: 50,
      description: 'Clear',
      source: 'open-meteo',
      observedAt: '2026-06-10T12:00:00.000Z',
    });

    render(
      <AddCafeForm
        beans={mockBeans}
        cafes={[]}
        shots={[]}
        onAddVisit={vi.fn().mockResolvedValue(savedCafe)}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Pick test café' }));
    await user.click(screen.getByRole('button', { name: 'Flat white' }));
    await user.click(screen.getByRole('button', { name: 'Save visit' }));

    const actions = await waitFor(() => {
      const el = document.querySelector('.add-cafe-form__map-actions');
      expect(el).toBeTruthy();
      return el as HTMLElement;
    });
    const link = within(actions).getByRole('link', { name: 'Open in Google Maps' });
    expect(link.getAttribute('href')).toContain('query_place_id=ChIJtest-place');
  });
});
