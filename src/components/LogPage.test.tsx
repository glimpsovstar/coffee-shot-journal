import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { mockBeans } from '../test/fixtures';
import { LogPage } from './LogPage';

const defaultProps = {
  section: 'shot' as const,
  onSectionChange: vi.fn(),
  beans: mockBeans,
  cafes: [],
  shots: [],
  resolvePhotos: () => [],
  onAddShot: vi.fn(),
  onAddBean: vi.fn(),
  onAddCafe: vi.fn(),
  onAddBeanPhotos: vi.fn(),
  onRemoveBeanPhoto: vi.fn(),
  onAddCafePhotos: vi.fn(),
  onRemoveCafePhoto: vi.fn(),
};

describe('LogPage', () => {
  it('shows new shot form by default section', () => {
    render(<LogPage {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'Log a shot' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Bean catalogue' })).not.toBeInTheDocument();
  });

  it('switches to beans section when requested', async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();

    render(<LogPage {...defaultProps} onSectionChange={onSectionChange} />);

    await user.click(screen.getByRole('button', { name: 'Beans' }));
    expect(onSectionChange).toHaveBeenCalledWith('beans');
  });

  it('switches to café section when requested', async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();

    render(<LogPage {...defaultProps} onSectionChange={onSectionChange} />);

    await user.click(screen.getByRole('button', { name: 'Café' }));
    expect(onSectionChange).toHaveBeenCalledWith('cafes');
  });

  it('renders import form when section is import', () => {
    render(<LogPage {...defaultProps} section="import" />);

    expect(screen.getByRole('heading', { name: 'Import past shot' })).toBeInTheDocument();
  });
});
