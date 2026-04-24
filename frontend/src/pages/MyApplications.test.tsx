import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import {
  resetDashboardFakeState,
  setDashboardFakeState,
} from '../features/dashboard/fakeDashboardProvider';
import type { MyApplication } from '../features/dashboard/types';
import MyApplications from './MyApplications';

const submittedConferenceApp: MyApplication = {
  id: 'conf-app-1',
  applicationType: 'conference_application',
  sourceModule: 'M2',
  sourceId: 'conf-1',
  sourceTitle: 'Asiamath 2026 Workshop',
  linkedConferenceTitle: null,
  viewerStatus: 'under_review',
  submittedAt: '2026-04-30T09:00:00.000Z',
  releasedDecision: null,
  nextAction: 'view_submission',
  postVisitReportStatus: null,
};

const draftGrantApp: MyApplication = {
  id: 'grant-app-1',
  applicationType: 'grant_application',
  sourceModule: 'M7',
  sourceId: 'grant-1',
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

describe('MyApplications page', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDashboardFakeState();
  });

  it('redirects to /login when no token is present', async () => {
    renderWithRouter(<MyApplications />, '/me/applications', '/me/applications');

    await waitFor(() => {
      expect(screen.queryByText(/Loading your applications/i)).not.toBeInTheDocument();
    });
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
  });

  it('renders an under-review conference application with a View submission link to its detail page', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardFakeState([submittedConferenceApp]);

    renderWithRouter(<MyApplications />, '/me/applications', '/me/applications');

    expect(
      await screen.findByRole('heading', { name: 'Asiamath 2026 Workshop' })
    ).toBeInTheDocument();
    expect(screen.getByText('Under review')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View submission' })).toHaveAttribute(
      'href',
      '/me/applications/conf-app-1'
    );
  });

  it('renders a draft grant application with linked conference title and Continue draft link', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardFakeState([draftGrantApp]);

    renderWithRouter(<MyApplications />, '/me/applications', '/me/applications');

    expect(
      await screen.findByRole('heading', { name: 'Asiamath 2026 Travel Grant' })
    ).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText(/Linked conference: Asiamath 2026 Workshop/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue draft' })).toHaveAttribute(
      'href',
      '/me/applications/grant-app-1'
    );
  });

  it('renders a released accepted conference decision with its display label and View result link', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardFakeState([releasedAcceptedApp]);

    renderWithRouter(<MyApplications />, '/me/applications', '/me/applications');

    expect(
      await screen.findByRole('heading', { name: 'Asiamath 2025 Conference' })
    ).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View result' })).toHaveAttribute(
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
