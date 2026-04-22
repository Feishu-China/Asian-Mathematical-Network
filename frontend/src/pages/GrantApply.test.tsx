import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as authApi from '../api/auth';
import { renderWithRouter } from '../test/renderWithRouter';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import {
  fakeConferenceProvider,
  resetConferenceFakeState,
} from '../features/conference/fakeConferenceProvider';
import { grantProvider } from '../features/grant/grantProvider';
import { fakeGrantProvider, resetGrantFakeState } from '../features/grant/fakeGrantProvider';
import GrantApply from './GrantApply';

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
    renderWithRouter(
      <GrantApply />,
      '/grants/asiamath-2026-travel-grant/apply',
      '/grants/:slug/apply'
    );

    expect(await screen.findByText('Role: Visitor')).toBeInTheDocument();
    expect(await screen.findByText(/sign in to start a grant application/i)).toBeInTheDocument();
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
    expect(screen.getByText(/draft in progress/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /submit application/i }));
    expect(await screen.findByText(/application submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/submitted and under review/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Released outcome$/)).not.toBeInTheDocument();
  });

  it('hydrates an existing grant draft when the page reloads', async () => {
    const linkedConferenceApplicationId = await seedSubmittedConferenceApplication(
      'grant-applicant-existing'
    );

    await fakeGrantProvider.createGrantApplication('grant-published-001', {
      linkedConferenceApplicationId,
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

    expect(await screen.findByText(/draft saved/i)).toBeInTheDocument();
    expect(screen.getByText(/draft in progress/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saved funding request')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saved travel plan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saved funding need')).toBeInTheDocument();
  });

  it('shows a viewer-safe released result sample for a runtime viewer email mapped to the demo account', async () => {
    const linkedConferenceApplicationId = await seedSubmittedConferenceApplication(
      'grant-runtime-release-token'
    );
    mockedGetMe.mockResolvedValueOnce({
      user: {
        email: 'grant.submit@example.com',
      },
    });

    const draft = await fakeGrantProvider.createGrantApplication('grant-published-001', {
      linkedConferenceApplicationId,
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
      linkedConferenceId: '64af0291-cd91-4420-a6ee-9a9d2ca2f9cc',
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
      linkedConferenceId: '64af0291-cd91-4420-a6ee-9a9d2ca2f9cc',
      linkedConferenceApplicationId: '8cd9e4b3-e8e5-439c-ad14-82739ca9c56e',
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
  });
});
