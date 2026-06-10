import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { mockBeans } from '../test/fixtures';
import { LogPage } from './LogPage';

describe('LogPage', () => {
  it('shows new shot form by default section', () => {
    render(
      <LogPage
        section="shot"
        onSectionChange={vi.fn()}
        beans={mockBeans}
        resolvePhotos={() => []}
        onAddShot={vi.fn()}
        onAddBean={vi.fn()}
        onAddBeanPhotos={vi.fn()}
        onRemoveBeanPhoto={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Log a shot' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Bean catalogue' })).not.toBeInTheDocument();
  });

  it('switches to beans section when requested', async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();

    render(
      <LogPage
        section="shot"
        onSectionChange={onSectionChange}
        beans={mockBeans}
        resolvePhotos={() => []}
        onAddShot={vi.fn()}
        onAddBean={vi.fn()}
        onAddBeanPhotos={vi.fn()}
        onRemoveBeanPhoto={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Beans' }));
    expect(onSectionChange).toHaveBeenCalledWith('beans');
  });

  it('renders import form when section is import', () => {
    render(
      <LogPage
        section="import"
        onSectionChange={vi.fn()}
        beans={mockBeans}
        resolvePhotos={() => []}
        onAddShot={vi.fn()}
        onAddBean={vi.fn()}
        onAddBeanPhotos={vi.fn()}
        onRemoveBeanPhoto={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Import past shot' })).toBeInTheDocument();
  });
});
