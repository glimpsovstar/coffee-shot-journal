import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockBeans } from '../test/fixtures';
import { BeanCatalogue } from './BeanCatalogue';

describe('BeanCatalogue', () => {
  it('renders all beans in the catalogue', () => {
    render(<BeanCatalogue beans={mockBeans} />);

    expect(screen.getByRole('heading', { name: 'Bean catalogue' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Test Ethiopia' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Test House' })).toBeInTheDocument();
    expect(screen.getByText('Citrus and floral.')).toBeInTheDocument();
  });
});
