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
  const resolvePhotos = () => [];

  it('shows empty state without chartable shots', () => {
    render(
      <AnalyticsPage
        shots={[{ ...chartableShot, doseIn: 0, yieldOut: 0, extractionTime: 0 }]}
        beans={mockBeans}
        resolvePhotos={resolvePhotos}
      />,
    );
    expect(screen.getByText('No chartable shots yet.')).toBeInTheDocument();
  });

  it('renders chart when shots have metrics', () => {
    render(
      <AnalyticsPage shots={[chartableShot]} beans={mockBeans} resolvePhotos={resolvePhotos} />,
    );
    expect(screen.getByRole('heading', { name: 'Analytics & insights' })).toBeInTheDocument();
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('shows dial-in suggestions for the latest chartable home shot', () => {
    render(
      <AnalyticsPage shots={[chartableShot]} beans={mockBeans} resolvePhotos={resolvePhotos} />,
    );
    expect(screen.getByRole('heading', { name: 'Dial-in suggestions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get dial-in suggestions' })).toBeInTheDocument();
  });
});
