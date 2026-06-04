import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockBeans } from '../test/fixtures';
import * as photoExif from '../utils/photoExif';
import * as weather from '../services/weather';
import { AddShotForm } from './AddShotForm';

vi.mock('../utils/photoExif', async (importOriginal) => {
  const actual = await importOriginal<typeof photoExif>();
  return { ...actual, extractShotMetadataFromBlob: vi.fn() };
});

vi.mock('../services/weather', () => ({
  fetchWeatherAt: vi.fn(),
}));

describe('AddShotForm', () => {
  afterEach(() => {
    vi.mocked(photoExif.extractShotMetadataFromBlob).mockReset();
    vi.mocked(weather.fetchWeatherAt).mockReset();
  });

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

  it('updates brewed time and nearest suburb from photo metadata', async () => {
    const user = userEvent.setup();
    vi.mocked(photoExif.extractShotMetadataFromBlob).mockResolvedValue({
      brewedAt: new Date('2026-06-04T09:30:00'),
      gps: { latitude: -37.8136, longitude: 144.9631 },
      messages: ['Set brewed date and time from photo.', 'GPS found — pick the nearest suburb from suggestions.'],
    });

    render(<AddShotForm beans={mockBeans} onAddShot={vi.fn()} />);
    const form = screen.getByRole('heading', { name: 'Log a shot' }).closest('section')!;

    const file = new File([new Uint8Array(64)], 'shot.jpg', { type: 'image/jpeg' });
    const input = within(form).getByLabelText('Shot photos').parentElement!.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);

    await user.click(within(form).getByRole('button', { name: 'Update from photo' }));

    await waitFor(() => {
      expect(within(form).getByLabelText('Brewed')).toHaveValue('2026-06-04T09:30');
      expect(within(form).getByLabelText('Suburb')).toHaveValue('Melbourne, VIC, Australia');
    });
  });

  it('fetches weather when suburb is selected on submit', async () => {
    const user = userEvent.setup();
    const onAddShot = vi.fn();
    vi.mocked(weather.fetchWeatherAt).mockResolvedValue({
      temperatureC: 18,
      humidityPercent: 60,
      description: 'Partly cloudy',
      source: 'open-meteo',
      observedAt: '2026-06-04T09:00',
    });

    render(<AddShotForm beans={mockBeans} onAddShot={onAddShot} />);
    const form = screen.getByRole('heading', { name: 'Log a shot' }).closest('section')!;

    const suburbInput = within(form).getByLabelText('Suburb');
    await user.click(suburbInput);
    await user.type(suburbInput, 'Fitz');
    await user.keyboard('{Enter}');
    await user.type(within(form).getByLabelText('Grind setting'), '14');
    await user.click(within(form).getByRole('button', { name: 'Add shot' }));

    await waitFor(() => {
      expect(weather.fetchWeatherAt).toHaveBeenCalled();
      expect(onAddShot).toHaveBeenCalled();
    });

    const payload = onAddShot.mock.calls[0]![0];
    expect(payload.shot.weather?.description).toBe('Partly cloudy');
    expect(payload.shot.brewSuburb?.label).toMatch(/Fitzroy/);
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
