import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { dashboardProvider } from '../features/dashboard/dashboardProvider';
import { renderWithRouter } from '../test/renderWithRouter';
import {
  resetDashboardFakeState,
  seedDashboardDemoState,
  setDashboardFakeState,
} from '../features/dashboard/fakeDashboardProvider';
import type { MyApplication } from '../features/dashboard/types';
import MyApplications from './MyApplications';

const submittedConferenceApp: MyApplication = {
  id: 'conf-app-1',
  applicationType: 'conference_application',
  sourceModule: 'M2',
  sourceId: 'conf-1',
  sourceSlug: 'asiamath-2026-workshop',
  sourceTitle: 'Asiamath 2026 Workshop',
  linkedConferenceTitle: null,
  viewerStatus: 'under_review',
  submittedAt: '2026-04-30T09:00:00.000Z',
  releasedDecision: null,
  nextAction: 'view_submission',
  postVisitReportStatus: null,
};

const draftConferenceApp: MyApplication = {
  id: 'conf-app-draft-1',
  applicationType: 'conference_application',
  sourceModule: 'M2',
  sourceId: 'conf-draft-1',
  sourceSlug: 'integration-grant-conf-2026',
  sourceTitle: 'Integration Grant Conference 2026',
  linkedConferenceTitle: null,
  viewerStatus: 'draft',
  submittedAt: null,
  releasedDecision: null,
  nextAction: 'continue_draft',
  postVisitReportStatus: null,
};

const draftGrantApp: MyApplication = {
  id: 'grant-app-1',
  applicationType: 'grant_application',
  sourceModule: 'M7',
  sourceId: 'grant-1',
  sourceSlug: 'asiamath-2026-travel-grant',
  sourceTitle: 'Asiamath 2026 Travel Grant',
  linkedConferenceTitle: 'Asiamath 2026 Workshop',
  viewerStatus: 'draft',
  submittedAt: null,
  releasedDecision: null,
  nextAction: 'continue_draft',
  postVisitReportStatus: null,
};

const releasedAcceptedApp: MyApplication = {
  id: 'conf-app-2',
  applicationType: 'conference_application',
  sourceModule: 'M2',
  sourceId: 'conf-2',
  sourceSlug: 'asiamath-2025-conference',
  sourceTitle: 'Asiamath 2025 Conference',
  linkedConferenceTitle: null,
  viewerStatus: 'result_released',
  submittedAt: '2026-04-15T09:00:00.000Z',
  releasedDecision: {
    decisionKind: 'conference_admission',
    finalStatus: 'accepted',
    displayLabel: 'Accepted',
    releasedAt: '2026-04-29T12:00:00.000Z',
  },
  nextAction: 'view_result',
  postVisitReportStatus: null,
};

function LoginStateProbe() {
  const location = useLocation();

  return <div>{JSON.stringify(location.state)}</div>;
}

describe('MyApplications page', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDashboardFakeState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects to /login when no token is present', async () => {
    render(
      <MemoryRouter initialEntries={['/me/applications']}>
        <Routes>
          <Route path="/me/applications" element={<MyApplications />} />
          <Route path="/login" element={<LoginStateProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('{"returnTo":"/me/applications"}')).toBeInTheDocument();
    });
  });

  it('renders the shared applicant account menu and logs out to the portal', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'test-token');

    function PortalProbe() {
      return <div>Portal destination</div>;
    }

    render(
      <MemoryRouter initialEntries={['/me/applications']}>
        <Routes>
          <Route path="/me/applications" element={<MyApplications />} />
          <Route path="/portal" element={<PortalProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(await screen.findByRole('button', { name: 'Account' }));
    expect(screen.getByRole('link', { name: 'My Applications' })).toHaveAttribute(
      'href',
      '/me/applications'
    );
    expect(screen.getByRole('link', { name: 'My Profile' })).toHaveAttribute('href', '/me/profile');

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByText('Portal destination')).toBeInTheDocument();
  });

  it('shows empty hints in both sections when the user has no applications', async () => {
    localStorage.setItem('token', 'test-token');

    renderWithRouter(<MyApplications />, '/me/applications', '/me/applications');

    expect(
      await screen.findByText(/You have no conference applications yet/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You have no travel grant applications yet/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse conferences/i })).toHaveAttribute(
      'href',
      '/conferences'
    );
    expect(
      screen.getByRole('link', { name: /start from published conferences/i })
    ).toHaveAttribute('href', '/conferences');
  });

  it('shows a dedicated error state when application records fail to load', async () => {
    localStorage.setItem('token', 'test-token');
    vi.spyOn(dashboardProvider, 'listMyApplications').mockRejectedValueOnce(
      new Error('Backend unavailable')
    );

    renderWithRouter(<MyApplications />, '/me/applications', '/me/applications');

    expect(await screen.findByText('My applications unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(/we could not load your application records right now/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/you have no conference applications yet/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/you have no travel grant applications yet/i)).not.toBeInTheDocument();
  });

  it('renders the seeded demo application flow when demo state is loaded', async () => {
    localStorage.setItem('token', 'test-token');
    seedDashboardDemoState();

    renderWithRouter(<MyApplications />, '/me/applications', '/me/applications');

    expect(
      await screen.findByRole('heading', { name: 'Review Demo Conference 2026' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view submission/i })).toHaveAttribute(
      'href',
      '/me/applications/review-application-1'
    );
  });

  it('shows presenter-safe walkthrough shortcuts and preserves a caller return link', async () => {
    localStorage.setItem('token', 'test-token');
    seedDashboardDemoState();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/me/applications',
            state: {
              returnContext: {
                to: '/dashboard',
                label: 'Back to dashboard',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/me/applications" element={<MyApplications />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /presenter-safe walkthrough/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard'
    );
    expect(screen.getByRole('link', { name: /open latest walkthrough record/i })).toHaveAttribute(
      'href',
      '/me/applications/review-application-1'
    );
  });

  it('links the walkthrough shortcut to the first real application when records exist', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardFakeState([submittedConferenceApp, draftGrantApp]);

    renderWithRouter(<MyApplications />, '/me/applications', '/me/applications');

    expect(
      await screen.findByRole('heading', { name: 'Asiamath 2026 Workshop' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open latest walkthrough record/i })).toHaveAttribute(
      'href',
      '/me/applications/conf-app-1'
    );
  });

  it('renders an under-review conference application with source title and next step', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardFakeState([submittedConferenceApp]);

    renderWithRouter(<MyApplications />, '/me/applications', '/me/applications');

    expect(
      await screen.findByRole('heading', { name: 'Asiamath 2026 Workshop' })
    ).toBeInTheDocument();
    expect(screen.getByText('Under review')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view submission/i })).toHaveAttribute(
      'href',
      '/me/applications/conf-app-1'
    );
  });

  it('renders a draft grant application with linked conference title and continue-draft next step', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardFakeState([draftGrantApp]);

    renderWithRouter(<MyApplications />, '/me/applications', '/me/applications');

    expect(
      await screen.findByRole('heading', { name: 'Asiamath 2026 Travel Grant' })
    ).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText(/Linked conference: Asiamath 2026 Workshop/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue draft/i })).toHaveAttribute(
      'href',
      '/grants/asiamath-2026-travel-grant/apply'
    );
  });

  it('routes a draft conference application back to the editable conference apply page', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardFakeState([draftConferenceApp]);

    renderWithRouter(<MyApplications />, '/me/applications', '/me/applications');

    expect(
      await screen.findByRole('heading', { name: 'Integration Grant Conference 2026' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue draft/i })).toHaveAttribute(
      'href',
      '/conferences/integration-grant-conf-2026/apply'
    );
  });

  it('renders a released accepted conference decision with its display label and view-result next step', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardFakeState([releasedAcceptedApp]);

    renderWithRouter(<MyApplications />, '/me/applications', '/me/applications');

    expect(
      await screen.findByRole('heading', { name: 'Asiamath 2025 Conference' })
    ).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view result/i })).toHaveAttribute(
      'href',
      '/me/applications/conf-app-2'
    );
  });

  it('splits records into conference and grant sections', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardFakeState([submittedConferenceApp, draftGrantApp]);

    renderWithRouter(<MyApplications />, '/me/applications', '/me/applications');

    expect(
      await screen.findByRole('heading', { name: 'Asiamath 2026 Workshop' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Asiamath 2026 Travel Grant' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/You have no conference applications yet/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/You have no travel grant applications yet/i)).not.toBeInTheDocument();
  });
});
