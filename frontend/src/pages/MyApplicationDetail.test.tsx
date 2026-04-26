import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import {
  resetDashboardFakeState,
  setDashboardDetailFakeState,
} from '../features/dashboard/fakeDashboardProvider';
import type { MyApplicationDetail } from '../features/dashboard/types';
import MyApplicationDetailPage from './MyApplicationDetail';

const draftGrantDetail: MyApplicationDetail = {
  id: 'grant-app-1',
  applicationType: 'grant_application',
  sourceModule: 'M7',
  conferenceId: null,
  conferenceTitle: null,
  grantId: 'grant-1',
  grantTitle: 'Asiamath 2026 Travel Grant',
  linkedConferenceId: 'conf-1',
  linkedConferenceTitle: 'Asiamath 2026 Workshop',
  linkedConferenceApplicationId: 'conf-app-1',
  viewerStatus: 'draft',
  statement: 'I plan to attend and present.',
  travelPlanSummary: 'Round trip from Tokyo.',
  fundingNeedSummary: 'Airfare support.',
  extraAnswers: {},
  applicantProfileSnapshot: {},
  files: [],
  submittedAt: null,
  releasedDecision: null,
  postVisitReport: null,
  postVisitReportStatus: null,
};

const submittedConferenceDetail: MyApplicationDetail = {
  id: 'conf-app-1',
  applicationType: 'conference_application',
  sourceModule: 'M2',
  conferenceId: 'conf-1',
  conferenceTitle: 'Asiamath 2026 Workshop',
  grantId: null,
  grantTitle: null,
  linkedConferenceId: null,
  linkedConferenceTitle: null,
  linkedConferenceApplicationId: null,
  viewerStatus: 'under_review',
  statement: 'Would like to present my recent work.',
  travelPlanSummary: null,
  fundingNeedSummary: null,
  extraAnswers: {},
  applicantProfileSnapshot: {
    full_name: 'Jane Applicant',
    institution_name_raw: 'Kyoto University',
    country_code: 'JP',
    career_stage: 'postdoc',
    research_keywords: ['algebra', 'topology'],
  },
  files: [],
  submittedAt: '2026-05-05T09:00:00.000Z',
  releasedDecision: null,
  postVisitReport: null,
  postVisitReportStatus: null,
};

const releasedConferenceDetail: MyApplicationDetail = {
  ...submittedConferenceDetail,
  id: 'conf-app-2',
  viewerStatus: 'result_released',
  releasedDecision: {
    decisionKind: 'conference_admission',
    finalStatus: 'accepted',
    displayLabel: 'Accepted',
    releasedAt: '2026-04-29T12:00:00.000Z',
    noteExternal: 'Welcome to the conference.',
  },
};

const acceptedGrantDetailWithoutReport: MyApplicationDetail = {
  ...draftGrantDetail,
  id: 'grant-app-2',
  viewerStatus: 'result_released',
  submittedAt: '2026-05-01T09:00:00.000Z',
  releasedDecision: {
    decisionKind: 'travel_grant',
    finalStatus: 'accepted',
    displayLabel: 'Awarded',
    releasedAt: '2026-04-29T12:00:00.000Z',
    noteExternal: 'Your travel grant has been awarded.',
  },
  postVisitReport: null,
  postVisitReportStatus: null,
};

const acceptedGrantDetailWithReport: MyApplicationDetail = {
  ...acceptedGrantDetailWithoutReport,
  id: 'grant-app-3',
  postVisitReport: {
    id: 'report-grant-app-3',
    status: 'submitted',
    reportNarrative: 'I attended the workshop and presented a poster.',
    attendanceConfirmed: true,
    submittedAt: '2026-05-15T09:00:00.000Z',
  },
  postVisitReportStatus: 'submitted',
};

describe('MyApplicationDetail page', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDashboardFakeState();
  });

  it('redirects to /login when no token is present', async () => {
    renderWithRouter(
      <MyApplicationDetailPage />,
      '/me/applications/grant-app-1',
      '/me/applications/:id'
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading application/i)).not.toBeInTheDocument();
    });
  });

  it('renders a draft grant detail with linked conference, statement, travel plan, and funding need', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardDetailFakeState([draftGrantDetail]);

    renderWithRouter(
      <MyApplicationDetailPage />,
      '/me/applications/grant-app-1',
      '/me/applications/:id'
    );

    expect(
      await screen.findByRole('heading', { name: 'Asiamath 2026 Travel Grant' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Linked conference: Asiamath 2026 Workshop/)).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('I plan to attend and present.')).toBeInTheDocument();
    expect(screen.getByText('Round trip from Tokyo.')).toBeInTheDocument();
    expect(screen.getByText('Airfare support.')).toBeInTheDocument();
    expect(
      screen.getByText(/This application has not been submitted yet/i)
    ).toBeInTheDocument();
  });

  it('renders a submitted under-review conference detail with its frozen profile snapshot', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardDetailFakeState([submittedConferenceDetail]);

    renderWithRouter(
      <MyApplicationDetailPage />,
      '/me/applications/conf-app-1',
      '/me/applications/:id'
    );

    expect(
      await screen.findByRole('heading', { name: 'Asiamath 2026 Workshop' })
    ).toBeInTheDocument();
    expect(screen.getByText('Under review')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Profile at submission' })).toBeInTheDocument();
    expect(screen.getByText('Jane Applicant')).toBeInTheDocument();
    expect(screen.getByText('Kyoto University')).toBeInTheDocument();
    expect(screen.getByText('algebra, topology')).toBeInTheDocument();
  });

  it('renders a released accepted conference detail with its result block and external note', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardDetailFakeState([releasedConferenceDetail]);

    renderWithRouter(
      <MyApplicationDetailPage />,
      '/me/applications/conf-app-2',
      '/me/applications/:id'
    );

    expect(
      await screen.findByRole('heading', { name: 'Result' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Accepted').length).toBeGreaterThan(0);
    expect(screen.getByText('Welcome to the conference.')).toBeInTheDocument();
  });

  it('renders a not-found state when the backend returns 404 for the id', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardDetailFakeState([]);

    renderWithRouter(
      <MyApplicationDetailPage />,
      '/me/applications/missing-id',
      '/me/applications/:id'
    );

    expect(
      await screen.findByRole('heading', { name: 'Application not found' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to My applications/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
  });

  it('renders the post-visit report form for an accepted grant without a report and submits it', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardDetailFakeState([acceptedGrantDetailWithoutReport]);

    renderWithRouter(
      <MyApplicationDetailPage />,
      `/me/applications/${acceptedGrantDetailWithoutReport.id}`,
      '/me/applications/:id'
    );

    expect(
      await screen.findByRole('heading', { name: 'Submit post-visit report' })
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Report narrative/i), {
      target: { value: 'Workshop went well; I gave a 30-minute talk.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit report' }));

    expect(
      await screen.findByRole('heading', { name: 'Post-visit report' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Workshop went well; I gave a 30-minute talk.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Submit post-visit report' })
    ).not.toBeInTheDocument();
  });

  it('renders the submitted post-visit report and hides the form when one already exists', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardDetailFakeState([acceptedGrantDetailWithReport]);

    renderWithRouter(
      <MyApplicationDetailPage />,
      `/me/applications/${acceptedGrantDetailWithReport.id}`,
      '/me/applications/:id'
    );

    expect(
      await screen.findByRole('heading', { name: 'Post-visit report' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('I attended the workshop and presented a poster.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Submit post-visit report' })
    ).not.toBeInTheDocument();
  });

  it('does not show the post-visit report form for a conference application', async () => {
    localStorage.setItem('token', 'test-token');
    setDashboardDetailFakeState([releasedConferenceDetail]);

    renderWithRouter(
      <MyApplicationDetailPage />,
      `/me/applications/${releasedConferenceDetail.id}`,
      '/me/applications/:id'
    );

    expect(await screen.findByRole('heading', { name: 'Result' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Submit post-visit report' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Post-visit report' })
    ).not.toBeInTheDocument();
  });
});
