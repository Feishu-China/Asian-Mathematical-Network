import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import {
  resetDashboardFakeState,
  setDashboardFakeState,
} from '../features/dashboard/fakeDashboardProvider';
import type { MyApplication } from '../features/dashboard/types';
import MyApplications from './MyApplications';

const baseConferenceApp: MyApplication = {
  id: 'conf-app-1',
  applicationType: 'conference_application',
  sourceModule: 'M2',
  status: 'submitted',
  conferenceId: 'conf-1',
  conferenceSlug: 'asiamath-2026',
  conferenceTitle: 'Asiamath 2026 Workshop',
  grantId: null,
  grantSlug: null,
  grantTitle: null,
  linkedConferenceId: null,
  linkedConferenceApplicationId: null,
  submittedAt: '2026-04-30T09:00:00.000Z',
  decision: null,
  createdAt: '2026-04-30T08:00:00.000Z',
  updatedAt: '2026-04-30T09:00:00.000Z',
};

const draftGrantApp: MyApplication = {
  id: 'grant-app-1',
  applicationType: 'grant_application',
  sourceModule: 'M7',
  status: 'draft',
  conferenceId: null,
  conferenceSlug: null,
  conferenceTitle: null,
  grantId: 'grant-1',
  grantSlug: 'asiamath-2026-travel-grant',
  grantTitle: 'Asiamath 2026 Travel Grant',
  linkedConferenceId: 'conf-1',
  linkedConferenceApplicationId: 'conf-app-1',
  submittedAt: null,
  decision: null,
  createdAt: '2026-05-01T08:00:00.000Z',
  updatedAt: '2026-05-01T08:00:00.000Z',
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

  it('renders submitted conference applications with a view-conference CTA', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardFakeState([baseConferenceApp]);

    renderWithRouter(<MyApplications />, '/me/applications', '/me/applications');

    expect(
      await screen.findByRole('heading', { name: 'Asiamath 2026 Workshop' })
    ).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View conference' })).toHaveAttribute(
      'href',
      '/conferences/asiamath-2026'
    );
  });

  it('renders draft grant applications with a continue-draft CTA', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardFakeState([draftGrantApp]);

    renderWithRouter(<MyApplications />, '/me/applications', '/me/applications');

    expect(
      await screen.findByRole('heading', { name: 'Asiamath 2026 Travel Grant' })
    ).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue draft' })).toHaveAttribute(
      'href',
      '/grants/asiamath-2026-travel-grant/apply'
    );
  });

  it('splits records into conference and grant sections', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardFakeState([baseConferenceApp, draftGrantApp]);

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
