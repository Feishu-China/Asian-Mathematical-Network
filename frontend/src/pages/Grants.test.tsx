import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import { resetGrantFakeState } from '../features/grant/fakeGrantProvider';
import Grants from './Grants';
import GrantDetail from './GrantDetail';

describe('grant public pages', () => {
  beforeEach(() => {
    localStorage.clear();
    resetGrantFakeState();
  });

  it('renders the public grant list and hides draft opportunities', async () => {
    renderWithRouter(<Grants />, '/grants', '/grants');

    expect(await screen.findByRole('heading', { name: 'Asiamath 2026 Travel Grant' })).toBeInTheDocument();
    expect(screen.queryByText('Asiamath 2026 Draft Grant')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view details/i })).toHaveAttribute(
      'href',
      '/grants/asiamath-2026-travel-grant'
    );
  });

  it('renders grant detail with prerequisite guidance and an apply CTA', async () => {
    renderWithRouter(<GrantDetail />, '/grants/asiamath-2026-travel-grant', '/grants/:slug');

    expect(
      await screen.findByText('Partial travel support for accepted participants.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/submit your conference application first, then request travel support/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /apply for grant/i })).toHaveAttribute(
      'href',
      '/grants/asiamath-2026-travel-grant/apply'
    );
  });
});
