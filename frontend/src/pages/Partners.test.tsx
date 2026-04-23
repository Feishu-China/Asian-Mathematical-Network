import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import { resetPartnerFakeState } from '../features/partner/fakePartnerProvider';
import Partners from './Partners';

describe('partner public pages', () => {
  beforeEach(() => {
    localStorage.clear();
    resetPartnerFakeState();
  });

  it('renders the partners surface with an expertise-matching teaser', async () => {
    renderWithRouter(<Partners />, '/partners', '/partners');

    expect(
      await screen.findByRole('heading', { name: 'Institute for Mathematical Systems and Data' })
    ).toBeInTheDocument();
    expect(screen.getByText('Industry and partner network')).toBeInTheDocument();
    expect(
      screen.getByText(/Institutional collaboration, applied research pathways, and expertise matching/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /expertise matching teaser/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view matching context/i })).toHaveAttribute(
      'href',
      '/scholars/prof-reviewer'
    );
  });
});
