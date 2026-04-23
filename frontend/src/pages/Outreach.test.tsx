import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import Outreach from './Outreach';

describe('outreach preview page', () => {
  it('renders the outreach landing as a static breadth surface', async () => {
    renderWithRouter(<Outreach />, '/outreach', '/outreach');

    expect(await screen.findByRole('heading', { name: 'Outreach' })).toBeInTheDocument();
    expect(screen.getByText('Outreach programs')).toBeInTheDocument();
    expect(
      screen.getByText(/math circles, public lectures, and school-facing engagement programs/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Regional Math Circle Preview' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /community pathway/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view media recap sample/i })).toHaveAttribute(
      'href',
      '/videos'
    );
  });
});
