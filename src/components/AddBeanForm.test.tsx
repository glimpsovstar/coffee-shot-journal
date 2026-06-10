import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddBeanForm } from './AddBeanForm';

describe('AddBeanForm', () => {
  it('submits a valid single-origin bean', async () => {
    const user = userEvent.setup();
    const onAddBean = vi.fn();

    render(<AddBeanForm onAddBean={onAddBean} />);

    await user.type(screen.getByLabelText('Name'), 'New Ethiopia');
    await user.type(screen.getByLabelText('Roaster'), 'Test Roasters');
    await user.type(screen.getByLabelText('Origin'), 'Yirgacheffe, Ethiopia');
    await user.selectOptions(screen.getByLabelText('Roast style'), 'light');
    await user.type(screen.getByLabelText('Roast date'), '2026-05-01');
    await user.clear(screen.getByLabelText('Purchased'));
    await user.type(screen.getByLabelText('Purchased'), '2026-05-02');
    await user.click(screen.getByRole('button', { name: 'Add bean' }));

    await waitFor(() => {
      expect(onAddBean).toHaveBeenCalledTimes(1);
    });

    const payload = onAddBean.mock.calls[0]![0];
    expect(payload.bean.name).toBe('New Ethiopia');
    expect(payload.bean.kind).toBe('single_origin');
    expect(payload.bean.blendComponents).toEqual([]);
    expect(payload.bean.roastStyle).toBe('light');
  });

  it('keeps bean details visible when saving fails', async () => {
    const user = userEvent.setup();
    const onAddBean = vi.fn().mockRejectedValue(new Error('Cloud write failed'));

    render(<AddBeanForm onAddBean={onAddBean} />);

    await user.type(screen.getByLabelText('Name'), 'New Ethiopia');
    await user.type(screen.getByLabelText('Roaster'), 'Test Roasters');
    await user.type(screen.getByLabelText('Origin'), 'Yirgacheffe, Ethiopia');
    await user.type(screen.getByLabelText('Roast date'), '2026-05-01');
    await user.click(screen.getByRole('button', { name: 'Add bean' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Cloud write failed');
    expect(screen.getByLabelText('Name')).toHaveValue('New Ethiopia');
    expect(screen.getByLabelText('Roaster')).toHaveValue('Test Roasters');
  });

  it('shows blend name label and placeholder when kind is blend', async () => {
    const user = userEvent.setup();
    render(<AddBeanForm onAddBean={vi.fn()} />);
    expect(screen.getByPlaceholderText(/Yirgacheffe/)).toBeInTheDocument();
    await user.click(screen.getByLabelText('Blend'));
    expect(screen.getByLabelText('Blend name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/House espresso/)).toBeInTheDocument();
  });

  it('shows validation error when blend percents do not total 100', async () => {
    const user = userEvent.setup();
    const onAddBean = vi.fn();

    render(<AddBeanForm onAddBean={onAddBean} />);

    await user.click(screen.getByLabelText('Blend'));
    await user.type(screen.getByLabelText('Name'), 'Bad Blend');
    await user.type(screen.getByLabelText('Roaster'), 'Test');
    await user.type(screen.getByLabelText('Blend name'), 'House mix');
    await user.type(screen.getByLabelText('Roast date'), '2026-05-01');

    const nameInputs = screen.getAllByPlaceholderText('Origin name');
    await user.type(nameInputs[0]!, 'Brazil');
    await user.type(nameInputs[1]!, 'Colombia');

    const percentInputs = screen.getAllByLabelText('Percent');
    expect(percentInputs).toHaveLength(2);
    await user.clear(percentInputs[0]!);
    await user.type(percentInputs[0]!, '40');
    await user.clear(percentInputs[1]!);
    await user.type(percentInputs[1]!, '40');

    await user.click(screen.getByRole('button', { name: 'Add bean' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/total 100%/i);
    expect(onAddBean).not.toHaveBeenCalled();
  });
});
