import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as authApi from '../api/auth';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { renderWithRouter } from '../test/renderWithRouter';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import {
  fakeConferenceProvider,
  resetConferenceFakeState,
} from '../features/conference/fakeConferenceProvider';
import { grantProvider } from '../features/grant/grantProvider';
import { fakeGrantProvider, resetGrantFakeState } from '../features/grant/fakeGrantProvider';
import Grants from './Grants';
import GrantDetail from './GrantDetail';
import GrantApply from './GrantApply';

function LoginStateProbe() {
  const location = useLocation();

  return <div>{JSON.stringify(location.state)}</div>;
}

vi.mock('../api/auth', async () => {
  const actual = await vi.importActual<typeof import('../api/auth')>('../api/auth');

  return {
    ...actual,
    getMe: vi.fn(async (token: string) => ({
      user: {
        email: `${token}@example.com`,
      },
    })),
  };
});

const seedSubmittedConferenceApplication = async (token: string) => {
  localStorage.setItem('token', token);
  const draft = await fakeConferenceProvider.createConferenceApplication('conf-published-001', {
    participationType: 'participant',
    statement: 'Conference prerequisite statement',
    abstractTitle: '',
    abstractText: '',
    interestedInTravelSupport: true,
    extraAnswers: {},
  });

  await fakeConferenceProvider.submitConferenceApplication(draft.id);
  return draft.id;
};

const mockedGetMe = vi.mocked(authApi.getMe);

describe('grant apply page', () => {
  beforeEach(() => {
    localStorage.clear();
    resetConferenceFakeState();
    resetGrantFakeState();
    mockedGetMe.mockImplementation(async (token: string) => ({
      user: {
        email: `${token}@example.com`,
      },
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows an authentication prompt when no token is present', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/grants/asiamath-2026-travel-grant/apply']}>
        <Routes>
          <Route path="/grants/:slug/apply" element={<GrantApply />} />
          <Route path="/login" element={<LoginStateProbe />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Role: Visitor')).toBeInTheDocument();
    expect(await screen.findByText(/sign in to start a grant application/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /go to login/i }));

    expect(
      screen.getByText('{"returnTo":"/grants/asiamath-2026-travel-grant/apply"}')
    ).toBeInTheDocument();
  });

  it('shows a prerequisite warning when no submitted conference application exists', async () => {
    localStorage.setItem('token', 'grant-applicant-missing-prereq');
    const user = userEvent.setup();

    renderWithRouter(
      <GrantApply />,
      '/grants/asiamath-2026-travel-grant/apply',
      '/grants/:slug/apply'
    );

    expect(
      await screen.findByText(/submit your conference application before requesting travel support/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/conference application required first/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/statement/i), 'Draft grant statement before prerequisite');
    await user.type(screen.getByLabelText(/travel plan summary/i), 'Draft travel plan before prerequisite');
    await user.type(screen.getByLabelText(/funding need summary/i), 'Draft funding need before prerequisite');

    expect(screen.getByDisplayValue('Draft grant statement before prerequisite')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Draft travel plan before prerequisite')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Draft funding need before prerequisite')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save draft/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /submit application/i })).toBeDisabled();
  });

  it('shows a no-application state when the conference prerequisite has already been submitted', async () => {
    await seedSubmittedConferenceApplication('grant-applicant-ready');

    renderWithRouter(
      <GrantApply />,
      '/grants/asiamath-2026-travel-grant/apply',
      '/grants/:slug/apply'
    );

    expect(await screen.findByText(/no grant application yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/you can start a separate grant application for this opportunity/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save draft/i })).toBeEnabled();
  });

  it('shows school-linked prerequisite copy and a ready school participation state', async () => {
    localStorage.setItem('token', 'grant-applicant-school');

    renderWithRouter(
      <GrantApply />,
      '/grants/asia-pacific-research-school-mobility-grant-2026/apply',
      '/grants/:slug/apply'
    );

    expect(
      await screen.findByText(
        /request mobility support through a dedicated grant application after your linked school participation is already in place/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /grant applications stay separate from school participation records, even when school participation is required first/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/linked school participation:/i)).toBeInTheDocument();
    expect(screen.getByText(/no grant application yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/submit your conference application before requesting travel support/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save draft/i })).toBeEnabled();
  });

  it('creates a draft and submits it for an eligible applicant', async () => {
    await seedSubmittedConferenceApplication('grant-applicant-eligible');
    const user = userEvent.setup();

    renderWithRouter(
      <GrantApply />,
      '/grants/asiamath-2026-travel-grant/apply',
      '/grants/:slug/apply'
    );

    await screen.findByRole('heading', { name: /travel grant application/i });
    expect(screen.getByText(/no grant application yet/i)).toBeInTheDocument();
    await user.type(
      screen.getByLabelText(/statement/i),
      'I am requesting travel support to present my work.'
    );
    await user.type(
      screen.getByLabelText(/travel plan summary/i),
      'Round trip from Singapore to Seoul with 4 nights lodging.'
    );
    await user.type(
      screen.getByLabelText(/funding need summary/i),
      'Airfare support requested; accommodation partially self-funded.'
    );
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    expect(await screen.findByText(/draft saved/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /draft in progress/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /submit application/i }));
    expect(await screen.findByText(/application submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/submitted and under review/i)).toBeInTheDocument();
    expect(screen.getByText('Applicant view: under review')).toBeInTheDocument();
    expect(screen.queryByText(/^Released outcome$/)).not.toBeInTheDocument();
  });

  it('renders the shared applicant account menu for signed-in applicants', async () => {
    localStorage.setItem('token', 'grant-applicant-eligible');

    renderWithRouter(
      <GrantApply />,
      '/grants/asiamath-2026-travel-grant/apply',
      '/grants/:slug/apply'
    );

    await screen.findByRole('heading', { name: /travel grant application/i });
    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();
  });

  it('hydrates an existing grant draft when the page reloads', async () => {
    const linkedOpportunityApplicationId = await seedSubmittedConferenceApplication(
      'grant-applicant-existing'
    );

    await fakeGrantProvider.createGrantApplication('grant-published-001', {
      linkedOpportunityApplicationId,
      statement: 'Saved funding request',
      travelPlanSummary: 'Saved travel plan',
      fundingNeedSummary: 'Saved funding need',
      extraAnswers: {},
    });

    renderWithRouter(
      <GrantApply />,
      '/grants/asiamath-2026-travel-grant/apply',
      '/grants/:slug/apply'
    );

    expect(
      await screen.findByText(/this grant application draft is already on file/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Draft saved$/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /draft in progress/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saved funding request')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saved travel plan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saved funding need')).toBeInTheDocument();
  });

  it('shows a viewer-safe released result sample for a runtime viewer email mapped to the demo account', async () => {
    const linkedOpportunityApplicationId = await seedSubmittedConferenceApplication(
      'grant-runtime-release-token'
    );
    mockedGetMe.mockResolvedValueOnce({
      user: {
        email: 'grant.submit@example.com',
      },
    });

    const draft = await fakeGrantProvider.createGrantApplication('grant-published-001', {
      linkedOpportunityApplicationId,
      statement: 'Submitted request for released result sample',
      travelPlanSummary: 'Sample travel plan',
      fundingNeedSummary: 'Sample funding need',
      extraAnswers: {},
    });

    await fakeGrantProvider.submitGrantApplication(draft.id);

    renderWithRouter(
      <GrantApply />,
      '/grants/asiamath-2026-travel-grant/apply',
      '/grants/:slug/apply'
    );

    expect(await screen.findByText(/^Released outcome$/)).toBeInTheDocument();
    expect(screen.getByText(/travel grant awarded/i)).toBeInTheDocument();
    expect(screen.getByText('Applicant view: released outcome')).toBeInTheDocument();
    expect(
      screen.getByText(/this sample only shows the applicant-visible released outcome\. non-public review details remain hidden/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/internal decision/i)).not.toBeInTheDocument();
  });

  it('shows the released result sample for the seeded backend demo grant even when the real grant id is a UUID', async () => {
    localStorage.setItem('token', 'grant-runtime-real-backend');
    mockedGetMe.mockResolvedValueOnce({
      user: {
        email: 'grant.submit@example.com',
      },
    });

    vi.spyOn(grantProvider, 'getGrantBySlug').mockResolvedValueOnce({
      id: '4cb012a0-ca16-428b-9a22-913ad4c018a0',
      slug: 'integration-grant-2026-travel-support',
      title: 'Integration Grant 2026 Travel Support',
      grantType: 'conference_travel_grant',
      linkedOpportunityType: 'conference',
      linkedOpportunityId: '64af0291-cd91-4420-a6ee-9a9d2ca2f9cc',
      linkedOpportunityTitle: 'Integration Grant Conference 2026',
      description: 'Partial travel support for accepted participants.',
      eligibilitySummary: 'Open to eligible conference applicants.',
      coverageSummary: 'Partial airfare and accommodation support.',
      applicationDeadline: '2026-06-05T23:59:59.000Z',
      status: 'published',
      reportRequired: true,
      publishedAt: '2026-04-22T12:00:00.000Z',
      isApplicationOpen: true,
    });
    vi.spyOn(grantProvider, 'getGrantApplicationForm').mockResolvedValueOnce({
      fields: [
        { key: 'linked_conference_application_id', type: 'select', required: true },
        { key: 'statement', type: 'textarea', required: true },
        { key: 'travel_plan_summary', type: 'textarea', required: true },
        { key: 'funding_need_summary', type: 'textarea', required: true },
      ],
    });
    vi.spyOn(grantProvider, 'getMyGrantApplication').mockResolvedValueOnce({
      id: '68156538-6ebf-4917-b952-504468e1012e',
      applicationType: 'grant_application',
      sourceModule: 'M7',
      grantId: '4cb012a0-ca16-428b-9a22-913ad4c018a0',
      grantTitle: 'Integration Grant 2026 Travel Support',
      linkedOpportunityType: 'conference',
      linkedOpportunityId: '64af0291-cd91-4420-a6ee-9a9d2ca2f9cc',
      linkedOpportunityTitle: 'Integration Grant Conference 2026',
      linkedOpportunityApplicationId: '8cd9e4b3-e8e5-439c-ad14-82739ca9c56e',
      applicantUserId: 'bf9d7496-637e-4260-ac5b-e9c969903bb3',
      status: 'submitted',
      statement: 'Released-result smoke applicant requesting travel support.',
      travelPlanSummary: 'Round trip with four nights of lodging.',
      fundingNeedSummary: 'Airfare support requested; accommodation partially self-funded.',
      extraAnswers: {},
      files: [],
      submittedAt: '2026-04-22T02:56:21.000Z',
      decidedAt: null,
      createdAt: '2026-04-22T02:56:20.000Z',
      updatedAt: '2026-04-22T02:56:21.000Z',
    });
    vi.spyOn(conferenceProvider, 'getMyConferenceApplication').mockResolvedValueOnce({
      id: '8cd9e4b3-e8e5-439c-ad14-82739ca9c56e',
      applicationType: 'conference_application',
      sourceModule: 'M2',
      conferenceId: '64af0291-cd91-4420-a6ee-9a9d2ca2f9cc',
      conferenceTitle: 'Integration Grant Conference 2026',
      applicantUserId: 'bf9d7496-637e-4260-ac5b-e9c969903bb3',
      status: 'submitted',
      participationType: 'participant',
      statement: 'Conference prerequisite statement for released-result smoke.',
      abstractTitle: '',
      abstractText: '',
      interestedInTravelSupport: true,
      extraAnswers: {},
      files: [],
      submittedAt: '2026-04-22T02:56:19.000Z',
      decidedAt: null,
      createdAt: '2026-04-22T02:56:18.000Z',
      updatedAt: '2026-04-22T02:56:19.000Z',
    });

    renderWithRouter(
      <GrantApply />,
      '/grants/integration-grant-2026-travel-support/apply',
      '/grants/:slug/apply'
    );

    expect(await screen.findByText(/^Released outcome$/)).toBeInTheDocument();
    expect(screen.getByText(/travel grant awarded/i)).toBeInTheDocument();
    expect(screen.getByText('Applicant view: released outcome')).toBeInTheDocument();
  });

  it('preserves the school-origin return path through grant apply and back out to the list', async () => {
    await seedSubmittedConferenceApplication('grant-applicant-roundtrip');
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
          <Route path="/grants/:slug/apply" element={<GrantApply />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: /back to school/i })).toHaveAttribute(
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
    expect(await screen.findByRole('link', { name: /start grant application/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /start grant application/i }));
    expect(await screen.findByRole('link', { name: /back to grant detail/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /back to grant detail/i }));
    expect(await screen.findByRole('link', { name: /back to grants/i })).toHaveAttribute(
      'href',
      '/grants'
    );

    await user.click(screen.getByRole('link', { name: /back to grants/i }));
    expect(await screen.findByRole('link', { name: /back to school/i })).toHaveAttribute(
      'href',
      '/schools/algebraic-geometry-research-school-2026'
    );
  });
});
