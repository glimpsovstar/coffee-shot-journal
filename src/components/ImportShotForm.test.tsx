import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { mockBeans } from '../test/fixtures';
import { ImportShotForm } from './ImportShotForm';

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

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

  it('waits for the import to persist before showing success', async () => {
    const save = deferred();
    const onImportShot = vi.fn(() => save.promise);
    const user = userEvent.setup();

    render(<ImportShotForm beans={mockBeans} onImportShot={onImportShot} />);

    await user.click(screen.getByRole('button', { name: 'Import shot' }));

    await waitFor(() => {
      expect(onImportShot).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole('button', { name: 'Importing…' })).toBeDisabled();
    expect(screen.queryByText('Shot imported.')).not.toBeInTheDocument();

    await act(async () => {
      save.resolve();
      await save.promise;
    });

    expect(await screen.findByText('Shot imported.')).toBeInTheDocument();
  });
});
