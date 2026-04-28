import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as authApi from '../api/auth';
import { dashboardProvider } from '../features/dashboard/dashboardProvider';
import { setDashboardFakeState } from '../features/dashboard/fakeDashboardProvider';
import { renderWithRouter } from '../test/renderWithRouter';
import { resetDashboardFakeState, seedDashboardDemoState } from '../features/dashboard/fakeDashboardProvider';
import type { MyApplication } from '../features/dashboard/types';
import Dashboard from './Dashboard';

vi.mock('../api/auth', async () => {
  const actual = await vi.importActual<typeof import('../api/auth')>('../api/auth');

  return {
    ...actual,
    getMe: vi.fn(async () => ({
      user: {
        email: 'demo.applicant@asiamath.org',
        status: 'active',
        role: 'applicant',
      },
    })),
  };
});

const mockedGetMe = vi.mocked(authApi.getMe);

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
    mockedGetMe.mockResolvedValue({
      user: {
        email: 'demo.applicant@asiamath.org',
        status: 'active',
        role: 'applicant',
      },
    });
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

  it('renders a reviewer workspace landing and skips applicant dashboard data', async () => {
    const listMyApplicationsSpy = vi.spyOn(dashboardProvider, 'listMyApplications');
    localStorage.setItem('token', 'dashboard-token');
    mockedGetMe.mockResolvedValueOnce({
      user: {
        email: 'demo.reviewer@asiamath.org',
        status: 'active',
        role: 'reviewer',
      },
    });

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('Role: Reviewer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open reviewer queue/i })).toHaveAttribute(
      'href',
      '/reviewer'
    );
    expect(
      screen.queryByText(/open your application workspace to review records or start a submission/i)
    ).not.toBeInTheDocument();
    expect(listMyApplicationsSpy).not.toHaveBeenCalled();
  });

  it('renders an organizer workspace landing instead of applicant-only dashboard content', async () => {
    const listMyApplicationsSpy = vi.spyOn(dashboardProvider, 'listMyApplications');
    localStorage.setItem('token', 'dashboard-token');
    mockedGetMe.mockResolvedValueOnce({
      user: {
        email: 'demo.organizer@asiamath.org',
        status: 'active',
        role: 'organizer',
        conference_staff_memberships: [
          {
            conference_id: 'conf-draft-001',
            staff_role: 'owner',
          },
        ],
      },
    });

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

  it('shows presenter-safe continuation shortcuts for the demo flow', async () => {
    localStorage.setItem('token', 'dashboard-token');
    seedDashboardDemoState();

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(await screen.findByRole('heading', { name: /presenter-safe walkthrough/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue in my applications/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
    expect(screen.getByRole('link', { name: /restart from portal/i })).toHaveAttribute(
      'href',
      '/portal'
    );
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
});
