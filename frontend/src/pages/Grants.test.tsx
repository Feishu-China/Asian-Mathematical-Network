import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import { resetGrantFakeState } from '../features/grant/fakeGrantProvider';
import { grantProvider } from '../features/grant/grantProvider';
import Grants from './Grants';
import GrantDetail from './GrantDetail';

describe('grant public pages', () => {
  beforeEach(() => {
    localStorage.clear();
    resetGrantFakeState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the public grant list and hides draft opportunities', async () => {
    renderWithRouter(<Grants />, '/grants', '/grants');

    expect(await screen.findByText('Role: Visitor')).toBeInTheDocument();
    expect(screen.getByText('Page mode: Hybrid')).toBeInTheDocument();
    expect(screen.getByText('Published grants only')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Asiamath 2026 Travel Grant' })).toBeInTheDocument();
    expect(screen.queryByText('Asiamath 2026 Draft Grant')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view details/i })).toHaveAttribute(
      'href',
      '/grants/asiamath-2026-travel-grant'
    );
  });

  it('shows a return link to my applications on the grant list when an applicant token is present', async () => {
    localStorage.setItem('token', 'applicant-1');

    renderWithRouter(<Grants />, '/grants', '/grants');

    expect(await screen.findByRole('heading', { name: 'Asiamath 2026 Travel Grant' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to my applications/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
  });

  it('renders grant detail with prerequisite guidance and an apply CTA', async () => {
    renderWithRouter(<GrantDetail />, '/grants/asiamath-2026-travel-grant', '/grants/:slug');

    expect(await screen.findByText('Role: Visitor')).toBeInTheDocument();
    expect(screen.getByText('Page mode: Hybrid')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /support snapshot/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /applicant handoff/i })).toBeInTheDocument();
    expect(
      await screen.findByText('Partial travel support for accepted participants.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/conference application required before grant submission/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/grant applications stay separate from conference applications/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start grant application/i })).toHaveAttribute(
      'href',
      '/grants/asiamath-2026-travel-grant/apply'
    );
  });

  it('shows a return link on grant detail when an applicant token is present', async () => {
    localStorage.setItem('token', 'applicant-1');

    renderWithRouter(<GrantDetail />, '/grants/asiamath-2026-travel-grant', '/grants/:slug');

    expect(
      await screen.findByText('Partial travel support for accepted participants.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to my applications/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
  });

  it('renders an error state when the public grant list request fails', async () => {
    vi.spyOn(grantProvider, 'listPublicGrants').mockRejectedValueOnce(new Error('Backend unavailable'));

    renderWithRouter(<Grants />, '/grants', '/grants');

    expect(await screen.findByText('We could not load grants right now.')).toBeInTheDocument();
    expect(screen.queryByText('Loading grants...')).not.toBeInTheDocument();
  });

  it('renders an error state when the grant detail request fails', async () => {
    vi.spyOn(grantProvider, 'getGrantBySlug').mockRejectedValueOnce(new Error('Backend unavailable'));

    renderWithRouter(<GrantDetail />, '/grants/asiamath-2026-travel-grant', '/grants/:slug');

    expect(await screen.findByText('We could not load this grant right now.')).toBeInTheDocument();
    expect(screen.queryByText('Loading grant...')).not.toBeInTheDocument();
  });
});
