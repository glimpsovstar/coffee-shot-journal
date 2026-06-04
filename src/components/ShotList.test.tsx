import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockBeans, mockShotNewer, mockShotOlder } from '../test/fixtures';
import { ShotList } from './ShotList';

describe('ShotList', () => {
  it('shows empty state when there are no shots', () => {
    render(<ShotList shots={[]} beans={mockBeans} resolvePhotos={() => []} />);

    expect(screen.getByText(/No shots logged yet/)).toBeInTheDocument();
  });

  it('renders shots newest first by brewed time', () => {
    render(
      <ShotList
        shots={[mockShotOlder, mockShotNewer]}
        beans={mockBeans}
        resolvePhotos={() => []}
      />,
    );

    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');
    const headings = items.map((item) =>
      within(item).getByRole('heading', { level: 3 }).textContent,
    );

    expect(headings).toEqual(['Test Ethiopia', 'Test Ethiopia']);

    const times = items.map((item) => within(item).getByRole('time'));
    expect(times[0]).toHaveAttribute('dateTime', mockShotNewer.brewedAt);
    expect(times[1]).toHaveAttribute('dateTime', mockShotOlder.brewedAt);
  });
});
