import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as weather from '../services/weather';
import * as photoExif from '../utils/photoExif';
import { mockBeans } from '../test/fixtures';
import type { Cafe } from '../types';
import { LogCafeCoffeeForm } from './LogCafeCoffeeForm';

vi.mock('../services/weather', () => ({
  fetchWeatherAt: vi.fn(),
}));

vi.mock('../utils/photoExif', async (importOriginal) => {
  const actual = await importOriginal<typeof photoExif>();
  const extractShotMetadataFromBlob = vi.fn();
  return {
    ...actual,
    extractShotMetadataFromBlob,
    extractShotMetadataFromBlobs: vi.fn(async (blobs: Blob[]) => {
      for (const blob of blobs) {
        const result = await extractShotMetadataFromBlob(blob);
        if (result.brewedAt || result.gps) return result;
      }
      if (blobs[0]) return extractShotMetadataFromBlob(blobs[0]);
      return { messages: ['Attach a photo first.'] };
    }),
  };
});

const mockCafe: Cafe = {
  id: 'cafe-1',
  name: 'Allpress Ponsonby',
  address: '8 Drake St, Auckland',
  latitude: -36.85,
  longitude: 174.75,
  notes: '',
  photos: [],
};

describe('LogCafeCoffeeForm', () => {
  afterEach(() => {
    vi.mocked(photoExif.extractShotMetadataFromBlob).mockReset();
    vi.mocked(weather.fetchWeatherAt).mockReset();
  });

  it('logs a café coffee with menu selection, weather, and options', async () => {
    const user = userEvent.setup();
    const onAddCoffee = vi.fn().mockResolvedValue(undefined);
    vi.mocked(weather.fetchWeatherAt).mockResolvedValue({
      temperatureC: 18,
      humidityPercent: 62,
      description: 'Partly cloudy',
      source: 'open-meteo',
      observedAt: '2026-06-10T12:00:00.000Z',
    });

    render(
      <LogCafeCoffeeForm cafe={mockCafe} beans={mockBeans} onAddCoffee={onAddCoffee} />,
    );

    await user.click(screen.getByRole('button', { name: 'Flat white' }));
    await user.click(screen.getByLabelText('Extra shot / strong'));
    await user.click(screen.getByLabelText('Alternative milk'));
    await user.click(screen.getByRole('button', { name: 'Log coffee' }));

    await waitFor(() => expect(onAddCoffee).toHaveBeenCalledOnce());

    const payload = onAddCoffee.mock.calls[0]![0];
    expect(payload.shot.cafeId).toBe('cafe-1');
    expect(payload.shot.beverageType).toBe('flat_white');
    expect(payload.shot.extraShot).toBe(true);
    expect(payload.shot.alternativeMilk).toBe(true);
    expect(payload.shot.shotSize).toBe('double');
    expect(payload.shot.context).toBe('cafe_purchased');
    expect(payload.shot.weather?.description).toBe('Partly cloudy');
    expect(weather.fetchWeatherAt).toHaveBeenCalledWith({
      latitude: mockCafe.latitude,
      longitude: mockCafe.longitude,
      at: expect.any(Date),
    });
  });

  it('requires a drink selection', async () => {
    const user = userEvent.setup();
    const onAddCoffee = vi.fn();

    render(
      <LogCafeCoffeeForm cafe={mockCafe} beans={mockBeans} onAddCoffee={onAddCoffee} />,
    );

    await user.click(screen.getByRole('button', { name: 'Log coffee' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/pick a coffee/i);
    expect(onAddCoffee).not.toHaveBeenCalled();
  });

  it('updates visit time from photo metadata', async () => {
    const user = userEvent.setup();
    vi.mocked(photoExif.extractShotMetadataFromBlob).mockResolvedValue({
      brewedAt: new Date('2026-06-04T09:30:00'),
      messages: ['Set brewed date and time from photo.'],
    });

    render(
      <LogCafeCoffeeForm cafe={mockCafe} beans={mockBeans} onAddCoffee={vi.fn()} />,
    );
    const form = screen.getByRole('heading', { name: 'Log a coffee' }).closest('section')!;

    const file = new File([new Uint8Array(64)], 'coffee.jpg', { type: 'image/jpeg' });
    const input = within(form).getByLabelText('Coffee photos').parentElement!.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);

    await user.click(within(form).getByRole('button', { name: 'Update from photo' }));

    await waitFor(() => {
      expect(within(form).getByLabelText('When')).toHaveValue('2026-06-04T09:30');
    });
  });
});
