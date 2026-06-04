import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { mockBeans } from '../test/fixtures';
import { AddShotForm } from './AddShotForm';

describe('AddShotForm', () => {
  it('lists beans as roaster and name in the selector', () => {
    render(<AddShotForm beans={mockBeans} onAddShot={vi.fn()} />);
    const select = screen.getByLabelText('Bean');

    expect(select).toHaveTextContent('Test Roasters — Test Ethiopia');
    expect(select).toHaveTextContent('Test Roasters — Test House');
  });

  it('shows message when bean catalogue is empty', () => {
    render(<AddShotForm beans={[]} onAddShot={vi.fn()} />);

    expect(
      screen.getByText(/Add beans to the catalogue before logging shots/),
    ).toBeInTheDocument();
  });

  it('shows validation error when grind setting is missing', async () => {
    const user = userEvent.setup();
    render(<AddShotForm beans={mockBeans} onAddShot={vi.fn()} />);
    const form = screen.getByRole('heading', { name: 'Log a shot' }).closest('section')!;

    await user.click(within(form).getByRole('button', { name: 'Add shot' }));

    expect(within(form).getByRole('alert')).toHaveTextContent('Grind setting is required.');
  });

  it('submits a shot with parsed numbers and ISO datetime', async () => {
    const user = userEvent.setup();
    const onAddShot = vi.fn();

    render(<AddShotForm beans={mockBeans} onAddShot={onAddShot} />);
    const form = screen.getByRole('heading', { name: 'Log a shot' }).closest('section')!;

    await user.type(within(form).getByLabelText('Grind setting'), '14.5');
    await user.clear(within(form).getByLabelText('Dose in (g)'));
    await user.type(within(form).getByLabelText('Dose in (g)'), '18.2');
    await user.clear(within(form).getByLabelText('Brewed'));
    await user.type(within(form).getByLabelText('Brewed'), '2026-06-04T09:30');
    await user.type(within(form).getByLabelText('Tasting notes'), 'Bright acidity.');
    const ratingRadios = within(form).getAllByRole('radio');
    await user.click(ratingRadios[ratingRadios.length - 1]!);
    await user.click(within(form).getByRole('button', { name: 'Add shot' }));

    expect(onAddShot).toHaveBeenCalledOnce();
    expect(onAddShot).toHaveBeenCalledWith({
      shot: {
        beanId: 'bean-a',
        brewedAt: new Date('2026-06-04T09:30').toISOString(),
        grinder: 'Niche Zero',
        grindSetting: '14.5',
        doseIn: 18.2,
        yieldOut: 36,
        extractionTime: 28,
        tastingNotes: 'Bright acidity.',
        rating: 5,
        photos: [],
      },
      photoBlobs: [],
    });
  });

  it('rejects non-positive dose', async () => {
    const user = userEvent.setup();
    const onAddShot = vi.fn();

    render(<AddShotForm beans={mockBeans} onAddShot={onAddShot} />);
    const form = screen.getByRole('heading', { name: 'Log a shot' }).closest('section')!;

    await user.type(within(form).getByLabelText('Grind setting'), '14');
    await user.clear(within(form).getByLabelText('Dose in (g)'));
    await user.type(within(form).getByLabelText('Dose in (g)'), '0');
    await user.click(within(form).getByRole('button', { name: 'Add shot' }));

    expect(within(form).getByRole('alert')).toHaveTextContent('Dose must be a positive number.');
    expect(onAddShot).not.toHaveBeenCalled();
  });
});
