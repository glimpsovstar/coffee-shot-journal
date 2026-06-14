import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { mockCafe } from '../test/fixtures';
import * as cafeMapKml from '../utils/cafeMapKml';
import { JournalBackupPanel } from './JournalBackupPanel';

vi.mock('../utils/cafeMapKml', () => ({
  downloadCafeMapKmlFile: vi.fn(() => ({
    kml: '<kml />',
    exportedCount: 1,
    skippedCount: 0,
  })),
}));

describe('JournalBackupPanel', () => {
  it('exports café map KML when button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <JournalBackupPanel
        cloudUserId={null}
        cafes={[mockCafe]}
        shots={[]}
        onRestored={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Download café map (KML)' }));

    expect(cafeMapKml.downloadCafeMapKmlFile).toHaveBeenCalledWith([mockCafe], []);
    expect(screen.getByText(/Exported 1 cafés with visit summaries/)).toBeInTheDocument();
  });

  it('disables café map export when there are no cafés', () => {
    render(
      <JournalBackupPanel
        cloudUserId={null}
        cafes={[]}
        shots={[]}
        onRestored={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Download café map (KML)' })).toBeDisabled();
  });
});
