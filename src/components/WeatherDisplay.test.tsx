import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WeatherDisplay } from './WeatherDisplay';

describe('WeatherDisplay', () => {
  it('shows icon, temperature, and secondary details', () => {
    render(
      <WeatherDisplay
        weather={{
          temperatureC: 10,
          humidityPercent: 89,
          description: 'Drizzle',
          weatherCode: 51,
          source: 'open-meteo',
          observedAt: '2026-06-04T08:00',
        }}
      />,
    );

    expect(screen.getByText('10°C')).toBeInTheDocument();
    expect(screen.getByText(/89% humidity · Drizzle/)).toBeInTheDocument();
    expect(screen.getByLabelText('10°C, 89% humidity, Drizzle')).toBeInTheDocument();
  });
});
