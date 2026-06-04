import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockBeans, mockShot } from '../test/fixtures';
import { ShotCard } from './ShotCard';

describe('ShotCard', () => {
  it('renders bean name, recipe, and tasting notes', () => {
    render(<ShotCard shot={mockShot} beans={mockBeans} photoItems={[]} />);

    expect(
      screen.getByRole('heading', { name: 'Test Roasters — Test Ethiopia' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/18g in → 36g out \(1:2\.0\)/)).toBeInTheDocument();
    expect(screen.getByText(/28s/)).toBeInTheDocument();
    expect(screen.getByText('Balanced and sweet.')).toBeInTheDocument();
    expect(screen.getByLabelText('4 out of 5 stars')).toBeInTheDocument();
  });

  it('shows unknown bean when bean id is missing', () => {
    render(
      <ShotCard shot={{ ...mockShot, beanId: 'missing' }} beans={mockBeans} photoItems={[]} />,
    );

    expect(screen.getByRole('heading', { name: 'Unknown bean' })).toBeInTheDocument();
  });

  it('renders photo gallery when items are provided', () => {
    render(
      <ShotCard
        shot={{ ...mockShot, photos: [{ id: 'p1', fileName: 'cup.jpg', mimeType: 'image/jpeg', createdAt: '' }] }}
        beans={mockBeans}
        photoItems={[{ photo: { id: 'p1', fileName: 'cup.jpg', mimeType: 'image/jpeg', createdAt: '' }, url: 'blob:test' }]}
      />,
    );

    expect(screen.getByRole('img', { name: 'cup.jpg' })).toBeInTheDocument();
  });

  it('omits tasting notes section when empty', () => {
    const { container } = render(
      <ShotCard shot={{ ...mockShot, tastingNotes: '' }} beans={mockBeans} photoItems={[]} />,
    );

    const labels = Array.from(container.querySelectorAll('dt')).map((dt) => dt.textContent);
    expect(labels).not.toContain('Tasting notes');
  });
});
