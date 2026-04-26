import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import {
  resetDashboardFakeState,
  setDashboardFakeState,
} from '../features/dashboard/fakeDashboardProvider';
import type { MyApplication } from '../features/dashboard/types';
import Dashboard from './Dashboard';
import { getMe } from '../api/auth';

vi.mock('../api/auth', () => ({
  getMe: vi.fn(),
}));

const mockedGetMe = vi.mocked(getMe);

const meResponse = {
  user: { id: 'user-1', email: 'jane@example.com', status: 'active', role: 'applicant' },
};

const draftConferenceApp: MyApplication = {
  id: 'conf-app-1',
  applicationType: 'conference_application',
  sourceModule: 'M2',
  sourceId: 'conf-1',
  sourceTitle: 'Asiamath 2026 Workshop',
  linkedConferenceTitle: null,
  viewerStatus: 'draft',
  submittedAt: null,
  releasedDecision: null,
  nextAction: 'continue_draft',
  postVisitReportStatus: null,
};

const underReviewGrantApp: MyApplication = {
  id: 'grant-app-1',
  applicationType: 'grant_application',
  sourceModule: 'M7',
  sourceId: 'grant-1',
  sourceTitle: 'Asiamath 2026 Travel Grant',
  linkedConferenceTitle: 'Asiamath 2026 Workshop',
  viewerStatus: 'under_review',
  submittedAt: '2026-04-30T09:00:00.000Z',
  releasedDecision: null,
  nextAction: 'view_submission',
  postVisitReportStatus: null,
};

describe('Dashboard widget', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDashboardFakeState();
    mockedGetMe.mockReset();
  });

  it('renders an empty hint and a View all link when the user has no applications', async () => {
    localStorage.setItem('token', 'test-token');
    mockedGetMe.mockResolvedValue(meResponse);

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(
      await screen.findByText(/You have not started any applications yet/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View all' })).toHaveAttribute(
      'href',
      '/me/applications'
    );
  });

  it('summarizes the applications by viewer_status when records are present', async () => {
    localStorage.setItem('token', 'test-token');
    mockedGetMe.mockResolvedValue(meResponse);
    setDashboardFakeState([draftConferenceApp, underReviewGrantApp]);

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(
      await screen.findByText(/You have 2 applications — 1 in draft, 1 under review\./i)
    ).toBeInTheDocument();
  });

  it('renders an error hint when listing applications fails', async () => {
    localStorage.setItem('token', 'test-token');
    mockedGetMe.mockResolvedValue(meResponse);
    const dashboardModule = await import('../features/dashboard/dashboardProvider');
    const spy = vi
      .spyOn(dashboardModule.dashboardProvider, 'listMyApplications')
      .mockRejectedValueOnce(new Error('boom'));

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(
      await screen.findByText(/We could not load your applications right now/i)
    ).toBeInTheDocument();

    spy.mockRestore();
  });
});
