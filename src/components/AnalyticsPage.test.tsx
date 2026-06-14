import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { mockBeans } from '../test/fixtures';
import type { Shot } from '../types';
import { AnalyticsPage } from './AnalyticsPage';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  LineChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ReferenceArea: () => null,
  ReferenceLine: () => null,
}));

const chartableShot: Shot = {
  id: 's1',
  beanId: 'b1',
  brewedAt: '2026-06-01T08:00:00',
  grinder: 'Niche',
  grindSetting: '14',
  doseIn: 18,
  yieldOut: 36,
  extractionTime: 28,
  tastingNotes: '',
  rating: 4,
  photos: [],
};

describe('AnalyticsPage', () => {
  it('shows empty state without chartable shots', () => {
    render(
      <AnalyticsPage
        shots={[{ ...chartableShot, doseIn: 0, yieldOut: 0, extractionTime: 0 }]}
        beans={mockBeans}
      />,
    );
    expect(screen.getByText('No chartable shots yet.')).toBeInTheDocument();
  });

  it('renders chart when shots have metrics', () => {
    render(<AnalyticsPage shots={[chartableShot]} beans={mockBeans} />);
    expect(screen.getByRole('heading', { name: 'Analytics & insights' })).toBeInTheDocument();
    expect(screen.getByText(/Typical espresso window/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('chart-container').length).toBeGreaterThanOrEqual(1);
  });

  it('shows trend-based dial-in suggestions and context chart from chart data', () => {
    const shotWithContext: Shot = {
      ...chartableShot,
      grindSetting: '14',
      weather: {
        temperatureC: 18,
        humidityPercent: 62,
        description: 'Clear',
        source: 'open-meteo',
        observedAt: '2026-06-01T08:00:00.000Z',
      },
    };
    render(<AnalyticsPage shots={[shotWithContext]} beans={mockBeans} />);
    expect(screen.getByRole('heading', { name: 'Dial-in suggestions' })).toBeInTheDocument();
    expect(screen.getByText(/bean age, grind, and humidity trends/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bean age, grind & humidity' })).toBeInTheDocument();
    expect(screen.getByText(/One point on the chart/i)).toBeInTheDocument();
    expect(screen.queryByText(/photo analysis/i)).not.toBeInTheDocument();
  });
});
