import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import * as authApi from '../api/auth';
import type { MeResponse } from '../api/auth';
import { dashboardProvider } from '../features/dashboard/dashboardProvider';
import { setDashboardFakeState } from '../features/dashboard/fakeDashboardProvider';
import { renderWithRouter } from '../test/renderWithRouter';
import { resetDashboardFakeState, seedDashboardDemoState } from '../features/dashboard/fakeDashboardProvider';
import type { MyApplication } from '../features/dashboard/types';
import Dashboard from './Dashboard';

const buildMeResponse = (user: MeResponse['user']): MeResponse => ({
  user,
  profile: {
    userId: 'user-applicant',
    slug: 'demo-applicant',
    fullName: 'Demo Applicant',
    title: null,
    institutionId: null,
    institutionNameRaw: null,
    countryCode: null,
    careerStage: null,
    bio: null,
    personalWebsite: null,
    researchKeywords: [],
    mscCodes: [],
    orcidId: null,
    coiDeclarationText: '',
    isProfilePublic: false,
    verificationStatus: 'unverified' as const,
    verifiedAt: null,
    createdAt: '2026-04-29T00:00:00.000Z',
    updatedAt: '2026-04-29T00:00:00.000Z',
  },
});

vi.mock('../api/auth', async () => {
  const actual = await vi.importActual<typeof import('../api/auth')>('../api/auth');

  return {
    ...actual,
    getMe: vi.fn(async () =>
      buildMeResponse({
        id: 'user-applicant',
        email: 'demo.applicant@asiamath.org',
        status: 'active',
        role: 'applicant',
        roles: ['applicant'],
        available_workspaces: ['applicant'],
        primary_role: 'applicant',
        createdAt: '2026-04-29T00:00:00.000Z',
        updatedAt: '2026-04-29T00:00:00.000Z',
      })
    ),
  };
});

const mockedGetMe = vi.mocked(authApi.getMe);

function LocationStateProbe() {
  const location = useLocation();

  return <pre>{JSON.stringify(location.state)}</pre>;
}

const releasedApplication: MyApplication = {
  id: 'released-application-1',
  applicationType: 'conference_application',
  sourceModule: 'M2',
  sourceId: 'conf-1',
  sourceSlug: 'applied-pde-exchange-2025',
  sourceTitle: 'Applied PDE Exchange 2025',
  linkedConferenceTitle: null,
  viewerStatus: 'result_released',
  submittedAt: '2025-08-12T09:00:00.000Z',
  releasedDecision: {
    decisionKind: 'conference_admission',
    finalStatus: 'rejected',
    displayLabel: 'Rejected',
    releasedAt: '2025-09-01T09:00:00.000Z',
  },
  nextAction: 'view_result',
  postVisitReportStatus: null,
};

const underReviewApplication: MyApplication = {
  id: 'under-review-application-1',
  applicationType: 'conference_application',
  sourceModule: 'M2',
  sourceId: 'conf-2',
  sourceSlug: 'regional-topology-symposium-2026',
  sourceTitle: 'Regional Topology Symposium 2026',
  linkedConferenceTitle: null,
  viewerStatus: 'under_review',
  submittedAt: '2026-04-22T09:00:00.000Z',
  releasedDecision: null,
  nextAction: 'view_submission',
  postVisitReportStatus: null,
};

describe('Dashboard page', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDashboardFakeState();
    mockedGetMe.mockResolvedValue(
      buildMeResponse({
        id: 'user-applicant',
        email: 'demo.applicant@asiamath.org',
        status: 'active',
        role: 'applicant',
        roles: ['applicant'],
        available_workspaces: ['applicant'],
        primary_role: 'applicant',
        createdAt: '2026-04-29T00:00:00.000Z',
        updatedAt: '2026-04-29T00:00:00.000Z',
      })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows a clear entry into the applications workspace even when no records exist', async () => {
    localStorage.setItem('token', 'dashboard-token');

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(
      screen.getByText(/open your application workspace to review records or start a submission/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open my applications/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
  });

  it('shows the seeded demo application summary and entry link', async () => {
    localStorage.setItem('token', 'dashboard-token');
    seedDashboardDemoState();

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(await screen.findByText(/review demo conference 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/1 active application in your workspace/i)).toBeInTheDocument();
    expect(screen.getByText('Under review')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open my applications/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
  });

  it('counts only unfinished applications as active and highlights the latest unfinished record', async () => {
    localStorage.setItem('token', 'dashboard-token');
    setDashboardFakeState([releasedApplication, underReviewApplication]);

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(await screen.findByText(/regional topology symposium 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/1 active application in your workspace/i)).toBeInTheDocument();
    expect(screen.getByText('Under review')).toBeInTheDocument();
    expect(screen.queryByText(/applied pde exchange 2025/i)).not.toBeInTheDocument();
  });

  it('shows a no-active-applications state when every application already has a released result', async () => {
    localStorage.setItem('token', 'dashboard-token');
    setDashboardFakeState([releasedApplication]);

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/no active applications right now/i)).toBeInTheDocument();
    expect(
      screen.getByText(/open your application workspace to review records or start a submission/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open my applications/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
  });

  it('keeps /dashboard as the applicant workspace for reviewer-enabled accounts and shows the switcher', async () => {
    localStorage.setItem('token', 'dashboard-token');
    mockedGetMe.mockResolvedValueOnce(
      buildMeResponse({
        id: 'user-reviewer',
        email: 'demo.reviewer@asiamath.org',
        status: 'active',
        role: 'reviewer',
        roles: ['applicant', 'reviewer'],
        available_workspaces: ['applicant', 'reviewer'],
        primary_role: 'reviewer',
        createdAt: '2026-04-29T00:00:00.000Z',
        updatedAt: '2026-04-29T00:00:00.000Z',
      })
    );

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('Role: Applicant')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /workspace/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open my applications/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
    expect(screen.getByRole('link', { name: /browse opportunities/i })).toHaveAttribute(
      'href',
      '/opportunities'
    );
  });

  it('still treats /dashboard as applicant root when an older auth payload omits available_workspaces', async () => {
    localStorage.setItem('token', 'dashboard-token');
    const legacyMeResponse = buildMeResponse({
      id: 'user-reviewer',
      email: 'demo.reviewer@asiamath.org',
      status: 'active',
      role: 'reviewer',
      roles: ['applicant', 'reviewer'],
      available_workspaces: ['applicant', 'reviewer'],
      primary_role: 'reviewer',
      createdAt: '2026-04-29T00:00:00.000Z',
      updatedAt: '2026-04-29T00:00:00.000Z',
    });
    delete (legacyMeResponse.user as Partial<(typeof legacyMeResponse.user)>).available_workspaces;
    mockedGetMe.mockResolvedValueOnce(legacyMeResponse as unknown as MeResponse);

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('Role: Applicant')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open my applications/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
  });

  it('renders an organizer workspace landing instead of applicant-only dashboard content', async () => {
    const listMyApplicationsSpy = vi.spyOn(dashboardProvider, 'listMyApplications');
    localStorage.setItem('token', 'dashboard-token');
    mockedGetMe.mockResolvedValueOnce(
      buildMeResponse({
        id: 'user-organizer',
        email: 'demo.organizer@asiamath.org',
        status: 'active',
        role: 'organizer',
        roles: ['applicant', 'organizer'],
        available_workspaces: ['applicant', 'organizer'],
        primary_role: 'organizer',
        conference_staff_memberships: [
          {
            conference_id: 'conf-draft-001',
            staff_role: 'owner',
          },
        ],
        createdAt: '2026-04-29T00:00:00.000Z',
        updatedAt: '2026-04-29T00:00:00.000Z',
      })
    );

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('Role: Organizer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open conference workspace/i })).toHaveAttribute(
      'href',
      '/organizer/conferences/conf-draft-001/applications'
    );
    expect(screen.queryByText('Role: Applicant')).not.toBeInTheDocument();
    expect(listMyApplicationsSpy).not.toHaveBeenCalled();
  });

  it('passes dashboard return context into the organizer workspace entry link', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'organizer-1');
    mockedGetMe.mockResolvedValueOnce(
      buildMeResponse({
        id: 'user-organizer',
        email: 'demo.organizer@asiamath.org',
        status: 'active',
        role: 'organizer',
        roles: ['applicant', 'organizer'],
        available_workspaces: ['applicant', 'organizer'],
        primary_role: 'organizer',
        conference_staff_memberships: [
          {
            conference_id: 'conf-draft-001',
            staff_role: 'owner',
          },
        ],
        createdAt: '2026-04-29T00:00:00.000Z',
        updatedAt: '2026-04-29T00:00:00.000Z',
      })
    );

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/organizer/conferences/:id/applications"
            element={<LocationStateProbe />}
          />
        </Routes>
      </MemoryRouter>
    );

    await user.click(await screen.findByRole('link', { name: /open conference workspace/i }));

    expect(await screen.findByText(/"to":"\/dashboard"/)).toBeInTheDocument();
    expect(screen.getByText(/"label":"Back to dashboard"/)).toBeInTheDocument();
  });

  it('navigates into the organizer workspace when the workspace card body is clicked', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'organizer-1');
    mockedGetMe.mockResolvedValueOnce(
      buildMeResponse({
        id: 'user-organizer',
        email: 'demo.organizer@asiamath.org',
        status: 'active',
        role: 'organizer',
        roles: ['applicant', 'organizer'],
        available_workspaces: ['applicant', 'organizer'],
        primary_role: 'organizer',
        conference_staff_memberships: [
          {
            conference_id: 'conf-draft-001',
            staff_role: 'owner',
          },
        ],
        createdAt: '2026-04-29T00:00:00.000Z',
        updatedAt: '2026-04-29T00:00:00.000Z',
      })
    );

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/organizer/conferences/:id/applications"
            element={<div>Organizer workspace destination</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();

    await user.click(
      screen.getByText(
        /Enter reviewer assignment, internal decision, and release-control surfaces without falling back to applicant-only content/i
      )
    );

    expect(await screen.findByText('Organizer workspace destination')).toBeInTheDocument();
  });

  it('renders the shared applicant account menu and logs out to the portal', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'dashboard-token');

    function PortalProbe() {
      return <div>Portal destination</div>;
    }

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/portal" element={<PortalProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(await screen.findByRole('button', { name: 'Account' }));
    expect(screen.getByRole('link', { name: 'My Dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'My Applications' })).toHaveAttribute(
      'href',
      '/me/applications'
    );
    expect(screen.getByRole('link', { name: 'My Profile' })).toHaveAttribute('href', '/me/profile');

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByText('Portal destination')).toBeInTheDocument();
  });

  it('does not show presenter-safe walkthrough shortcuts on the applicant dashboard', async () => {
    localStorage.setItem('token', 'dashboard-token');
    seedDashboardDemoState();

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(await screen.findByRole('link', { name: /open my applications/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
    expect(screen.queryByRole('heading', { name: /presenter-safe walkthrough/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /continue in my applications/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /restart from portal/i })).not.toBeInTheDocument();
  });

  it('does not show demo walkthrough shortcuts on organizer workspace dashboards', async () => {
    localStorage.setItem('token', 'organizer-1');
    mockedGetMe.mockResolvedValueOnce(
      buildMeResponse({
        id: 'user-organizer',
        email: 'demo.organizer@asiamath.org',
        status: 'active',
        role: 'organizer',
        roles: ['applicant', 'organizer'],
        available_workspaces: ['applicant', 'organizer'],
        primary_role: 'organizer',
        conference_staff_memberships: [
          {
            conference_id: 'conf-draft-001',
            staff_role: 'owner',
          },
        ],
        createdAt: '2026-04-29T00:00:00.000Z',
        updatedAt: '2026-04-29T00:00:00.000Z',
      })
    );

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(await screen.findByRole('link', { name: /open conference workspace/i })).toHaveAttribute(
      'href',
      '/organizer/conferences/conf-draft-001/applications'
    );
    expect(screen.queryByRole('heading', { name: /presenter-safe walkthrough/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /continue in organizer queue/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /restart from portal/i })).not.toBeInTheDocument();
  });

  it('provides stable public exits from the dashboard hub', async () => {
    localStorage.setItem('token', 'dashboard-token');

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(await screen.findByRole('link', { name: /back to portal/i })).toHaveAttribute(
      'href',
      '/portal'
    );
    expect(screen.getByRole('link', { name: /browse opportunities/i })).toHaveAttribute(
      'href',
      '/opportunities'
    );
  });

  it('defines a dedicated hover override for primary dashboard shell links so dark CTA text stays readable', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/pages/Dashboard.css'), 'utf8');

    expect(css).toMatch(/\.dashboard-shell-link:hover\s*\{/);
    expect(css).toMatch(/\.dashboard-shell-link:hover\s*\{[^}]*color:\s*#fff;/s);
    expect(css).toMatch(
      /\.dashboard-shell-link:hover\s*\{[^}]*-webkit-text-fill-color:\s*#fff;/s
    );
  });

  it('defines a dedicated hover override for dashboard widget links so dark CTA text stays readable', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/pages/Dashboard.css'), 'utf8');

    expect(css).toMatch(/\.dashboard-widget__link:hover\s*\{/);
    expect(css).toMatch(/\.dashboard-widget__link:hover\s*\{[^}]*color:\s*#fff;/s);
    expect(css).toMatch(
      /\.dashboard-widget__link:hover\s*\{[^}]*-webkit-text-fill-color:\s*#fff;/s
    );
  });
});
