import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import * as weather from '../services/weather';
import { mockBeans } from '../test/fixtures';
import type { Cafe } from '../types';
import { LogCafeCoffeeForm } from './LogCafeCoffeeForm';

vi.mock('../services/weather', () => ({
  fetchWeatherAt: vi.fn(),
}));

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
  it('logs a café coffee with menu selection, weather, and options', async () => {
    const user = userEvent.setup();
    const onAddCoffee = vi.fn();
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
});
