import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from './SegmentedControl';

describe('SegmentedControl', () => {
  it('selects an option on click', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <SegmentedControl
        label="Roast"
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
        value="light"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Dark' }));
    expect(onChange).toHaveBeenCalledWith('dark');
  });
});
