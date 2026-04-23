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
    expect(screen.getByRole('heading', { name: /sample matching flow/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        /reviewing a scholar's public profile, research areas, and institution before requesting an introduction/i
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view sample scholar profile/i })).toHaveAttribute(
      'href',
      '/scholars/prof-reviewer'
    );
  });
});
