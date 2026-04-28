import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { resetReviewFakeState } from '../features/review/fakeReviewProvider';
import { reviewProvider } from '../features/review/reviewProvider';
import MyApplicationDetail from './MyApplicationDetail';

function LoginStateProbe() {
  const location = useLocation();

  return <div>{JSON.stringify(location.state)}</div>;
}

const acceptedGrantDetailWithoutReport = {
  id: 'grant-application-1',
  applicationType: 'grant_application',
  sourceModule: 'M7',
  conferenceId: 'review-conf-001',
  conferenceTitle: 'Review Demo Conference 2026',
  grantId: 'grant-1',
  grantTitle: 'Asiamath 2026 Travel Grant',
  linkedConferenceId: 'review-conf-001',
  linkedConferenceTitle: 'Review Demo Conference 2026',
  linkedConferenceApplicationId: 'review-application-1',
  viewerStatus: 'result_released',
  participationType: null,
  statement: 'Requesting travel support for the workshop.',
  abstractTitle: null,
  abstractText: null,
  interestedInTravelSupport: false,
  travelPlanSummary: 'Round-trip travel from Singapore with two hotel nights.',
  fundingNeedSummary: 'Airfare and local accommodation support.',
  extraAnswers: {},
  applicantProfileSnapshot: {
    fullName: 'Ada Lovelace',
    institutionNameRaw: 'National University of Singapore',
    countryCode: 'SG',
    careerStage: 'phd',
    researchKeywords: ['algebraic geometry'],
  },
  files: [],
  submittedAt: '2026-08-01T10:00:00.000Z',
  releasedDecision: {
    decisionKind: 'travel_grant',
    finalStatus: 'accepted',
    displayLabel: 'Awarded',
    noteExternal: 'Your travel grant has been awarded.',
    releasedAt: '2026-08-10T09:00:00.000Z',
  },
  postVisitReport: null,
  postVisitReportStatus: null,
} as any;

const acceptedGrantDetailWithReport = {
  ...acceptedGrantDetailWithoutReport,
  id: 'grant-application-2',
  postVisitReport: {
    id: 'report-1',
    status: 'submitted',
    reportNarrative: 'I attended the workshop and presented my recent results.',
    attendanceConfirmed: true,
    submittedAt: '2026-09-01T09:30:00.000Z',
  },
  postVisitReportStatus: 'submitted',
} as any;

describe('MyApplicationDetail page', () => {
  beforeEach(() => {
    localStorage.clear();
    resetReviewFakeState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an applicant-safe released result view for a single application', async () => {
    localStorage.setItem('token', 'organizer-1');
    await reviewProvider.upsertDecision('review-application-1', {
      finalStatus: 'accepted',
      noteInternal: 'Priority candidate',
      noteExternal: 'We are pleased to inform you that your application has been accepted.',
    });
    await reviewProvider.releaseDecision('review-application-1');

    localStorage.setItem('token', 'applicant-1');

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/me/applications/review-application-1',
            state: {
              returnContext: {
                to: '/me/applications',
                label: 'Back to applicant overview',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/me/applications/:id" element={<MyApplicationDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: 'Review Demo Conference 2026' })
    ).toBeInTheDocument();
    expect(screen.getByText('Role: Applicant')).toBeInTheDocument();
    expect(screen.getByText('Page mode: Hybrid')).toBeInTheDocument();
    expect(screen.getByText('Result released')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to applicant overview/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
    expect(screen.getByRole('heading', { name: /presenter shortcuts/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /restart from portal/i })).toHaveAttribute(
      'href',
      '/portal'
    );
    expect(
      screen.getByText('We are pleased to inform you that your application has been accepted.')
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /application summary/i })).toBeInTheDocument();
    expect(screen.getByText(/participation type:/i)).toBeInTheDocument();
    expect(screen.getByText(/^talk$/i)).toBeInTheDocument();
    expect(screen.getByText(/abstract title:/i)).toBeInTheDocument();
    expect(screen.getByText(/a note on birational geometry/i)).toBeInTheDocument();
    expect(screen.getByText(/abstract text:/i)).toBeInTheDocument();
    expect(screen.getByText(/this talk discusses a compactness result\./i)).toBeInTheDocument();
    expect(screen.getByText(/travel support:/i)).toBeInTheDocument();
    expect(screen.getByText(/requested/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /submit post-visit report/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^post-visit report$/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/internal status/i)).not.toBeInTheDocument();
  });

  it('renders a post-visit report form for an accepted grant and swaps to the submitted view after success', async () => {
    localStorage.setItem('token', 'applicant-1');
    vi.spyOn(reviewProvider, 'getMyApplicationDetail').mockResolvedValueOnce(
      acceptedGrantDetailWithoutReport
    );
    const submitSpy = vi
      .spyOn(reviewProvider as any, 'submitMyPostVisitReport')
      .mockResolvedValueOnce({
        id: 'report-1',
        status: 'submitted',
        reportNarrative: 'Workshop went well; I gave a 30-minute talk.',
        attendanceConfirmed: true,
        submittedAt: '2026-09-01T09:30:00.000Z',
      });

    render(
      <MemoryRouter initialEntries={['/me/applications/grant-application-1']}>
        <Routes>
          <Route path="/me/applications/:id" element={<MyApplicationDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: /submit post-visit report/i })
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/report narrative/i), {
      target: { value: 'Workshop went well; I gave a 30-minute talk.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

    expect(submitSpy).toHaveBeenCalledWith('grant-application-1', {
      reportNarrative: 'Workshop went well; I gave a 30-minute talk.',
      attendanceConfirmed: true,
    });
    expect(await screen.findByRole('heading', { name: /^post-visit report$/i })).toBeInTheDocument();
    expect(screen.getByText('Workshop went well; I gave a 30-minute talk.')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /submit post-visit report/i })
    ).not.toBeInTheDocument();
  });

  it('renders an existing post-visit report for an accepted grant without showing the form', async () => {
    localStorage.setItem('token', 'applicant-1');
    vi.spyOn(reviewProvider, 'getMyApplicationDetail').mockResolvedValueOnce(
      acceptedGrantDetailWithReport
    );

    render(
      <MemoryRouter initialEntries={['/me/applications/grant-application-2']}>
        <Routes>
          <Route path="/me/applications/:id" element={<MyApplicationDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /^post-visit report$/i })).toBeInTheDocument();
    expect(
      screen.getByText('I attended the workshop and presented my recent results.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /submit post-visit report/i })
    ).not.toBeInTheDocument();
  });

  it('renders a dedicated error state when the applicant detail request fails', async () => {
    localStorage.setItem('token', 'applicant-1');
    vi.spyOn(reviewProvider, 'getMyApplicationDetail').mockRejectedValueOnce(
      new Error('Backend unavailable')
    );

    render(
      <MemoryRouter initialEntries={['/me/applications/review-application-1']}>
        <Routes>
          <Route path="/me/applications/:id" element={<MyApplicationDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Application detail unavailable')).toBeInTheDocument();
    expect(screen.getByText(/we could not load this application detail right now/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to my applications/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
  });

  it('clears a stale session and redirects to /login when the detail request is unauthorized', async () => {
    localStorage.setItem('token', 'applicant-1');
    const unauthorizedError = Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });
    vi.spyOn(reviewProvider, 'getMyApplicationDetail').mockRejectedValueOnce(unauthorizedError);

    render(
      <MemoryRouter initialEntries={['/me/applications/review-application-1']}>
        <Routes>
          <Route path="/me/applications/:id" element={<MyApplicationDetail />} />
          <Route path="/login" element={<LoginStateProbe />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('{"returnTo":"/me/applications/review-application-1"}')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('redirects to /login with a returnTo state when no applicant session is present', async () => {
    render(
      <MemoryRouter initialEntries={['/me/applications/review-application-1']}>
        <Routes>
          <Route path="/me/applications/:id" element={<MyApplicationDetail />} />
          <Route path="/login" element={<LoginStateProbe />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('{"returnTo":"/me/applications/review-application-1"}')).toBeInTheDocument();
  });
});
