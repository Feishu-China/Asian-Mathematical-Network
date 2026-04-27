import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
    expect(screen.getAllByRole('link', { name: /view details/i })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: expect.stringContaining('/grants/asiamath-2026-travel-grant') }),
        expect.objectContaining({
          href: expect.stringContaining(
            '/grants/asia-pacific-research-school-mobility-grant-2026'
          ),
        }),
      ])
    );
  });

  it('keeps the shared public browse header, grant metadata, and detail CTA visible on the list page', async () => {
    renderWithRouter(<Grants />, '/grants', '/grants');

    expect(screen.getByRole('navigation', { name: /public sections/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Travel grants' })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Asiamath 2026 Travel Grant' })
    ).toBeInTheDocument();
    expect(screen.getByText('Conference travel grant')).toBeInTheDocument();
    expect(screen.getByText('Post-visit reporting required')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /view details/i })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: expect.stringContaining('/grants/asiamath-2026-travel-grant') }),
      ])
    );
  });

  it('shows a return link to the dashboard on the grant list when an applicant token is present', async () => {
    localStorage.setItem('token', 'applicant-1');

    renderWithRouter(<Grants />, '/grants', '/grants');

    expect(await screen.findByRole('heading', { name: 'Asiamath 2026 Travel Grant' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard'
    );
  });

  it('preserves a school-origin return path on the grant list while keeping detail one level up', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/grants',
            state: {
              returnContext: {
                to: '/schools/algebraic-geometry-research-school-2026',
                label: 'Back to school',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/grants" element={<Grants />} />
          <Route path="/grants/:slug" element={<GrantDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Asiamath 2026 Travel Grant' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to school/i })).toHaveAttribute(
      'href',
      '/schools/algebraic-geometry-research-school-2026'
    );

    const schoolDetailLink = screen
      .getAllByRole('link', { name: /view details/i })
      .find(
        (link) =>
          link.getAttribute('href') === '/grants/asia-pacific-research-school-mobility-grant-2026'
      );

    expect(schoolDetailLink).toBeTruthy();
    await user.click(schoolDetailLink!);

    expect(
      await screen.findByText(
        'Mobility support for selected participants in the Asia-Pacific Research School in Algebraic Geometry.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to grants/i })).toHaveAttribute('href', '/grants');

    await user.click(screen.getByRole('link', { name: /back to grants/i }));

    expect(
      await screen.findByRole('link', { name: /back to school/i })
    ).toHaveAttribute('href', '/schools/algebraic-geometry-research-school-2026');
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

  it('renders school-linked grant detail with school prerequisite guidance', async () => {
    renderWithRouter(
      <GrantDetail />,
      '/grants/asia-pacific-research-school-mobility-grant-2026',
      '/grants/:slug'
    );

    expect(
      await screen.findByText(/mobility support for selected participants in the asia-pacific research school in algebraic geometry/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/school participation required before grant submission/i)).toBeInTheDocument();
    expect(screen.getByText(/grant applications stay separate from school participation records/i)).toBeInTheDocument();
    expect(screen.getByText('School mobility grant')).toBeInTheDocument();
  });

  it('shows a return link from grant detail back to the grant list', async () => {
    renderWithRouter(<GrantDetail />, '/grants/asiamath-2026-travel-grant', '/grants/:slug');

    expect(
      await screen.findByText('Partial travel support for accepted participants.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to grants/i })).toHaveAttribute(
      'href',
      '/grants'
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
