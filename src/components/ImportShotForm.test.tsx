import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { mockBeans } from '../test/fixtures';
import { ImportShotForm } from './ImportShotForm';

describe('ImportShotForm', () => {
  it('imports a shot with only bean and date', async () => {
    const onImportShot = vi.fn();
    const user = userEvent.setup();

    render(<ImportShotForm beans={mockBeans} onImportShot={onImportShot} />);

    await user.clear(screen.getByLabelText('Brewed'));
    await user.type(screen.getByLabelText('Brewed'), '2024-01-15T08:00');
    await user.click(screen.getByRole('button', { name: 'Import shot' }));

    await waitFor(() => {
      expect(onImportShot).toHaveBeenCalledTimes(1);
    });

    const payload = onImportShot.mock.calls[0]![0];
    expect(payload.shot.beanId).toBe(mockBeans[0]!.id);
    expect(new Date(payload.shot.brewedAt).getFullYear()).toBe(2024);
    expect(payload.shot.doseIn).toBe(0);
    expect(payload.shot.grinder).toBe('');
    expect(payload.photoBlobs).toHaveLength(0);
  });

  it('does not require grind setting', async () => {
    const onImportShot = vi.fn();
    const user = userEvent.setup();

    render(<ImportShotForm beans={mockBeans} onImportShot={onImportShot} />);

    await user.click(screen.getByRole('button', { name: 'Import shot' }));

    await waitFor(() => {
      expect(onImportShot).toHaveBeenCalled();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the import draft when saving fails', async () => {
    const onImportShot = vi.fn().mockRejectedValue(new Error('Failed to write journal'));
    const user = userEvent.setup();

    render(<ImportShotForm beans={mockBeans} onImportShot={onImportShot} />);

    await user.type(screen.getByLabelText(/Tasting notes/), 'Imported shot draft');
    await user.click(screen.getByRole('button', { name: 'Import shot' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to write journal');
    expect(screen.getByLabelText(/Tasting notes/)).toHaveValue('Imported shot draft');
  });
});
