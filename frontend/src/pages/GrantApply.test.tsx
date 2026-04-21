import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test/renderWithRouter';
import {
  fakeConferenceProvider,
  resetConferenceFakeState,
} from '../features/conference/fakeConferenceProvider';
import { fakeGrantProvider, resetGrantFakeState } from '../features/grant/fakeGrantProvider';
import GrantApply from './GrantApply';

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

describe('grant apply page', () => {
  beforeEach(() => {
    localStorage.clear();
    resetConferenceFakeState();
    resetGrantFakeState();
  });

  it('shows an authentication prompt when no token is present', async () => {
    renderWithRouter(
      <GrantApply />,
      '/grants/asiamath-2026-travel-grant/apply',
      '/grants/:slug/apply'
    );

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

    await user.type(screen.getByLabelText(/statement/i), 'Draft grant statement before prerequisite');
    await user.type(screen.getByLabelText(/travel plan summary/i), 'Draft travel plan before prerequisite');
    await user.type(screen.getByLabelText(/funding need summary/i), 'Draft funding need before prerequisite');

    expect(screen.getByDisplayValue('Draft grant statement before prerequisite')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Draft travel plan before prerequisite')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Draft funding need before prerequisite')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save draft/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /submit application/i })).toBeDisabled();
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

    await user.click(screen.getByRole('button', { name: /submit application/i }));
    expect(await screen.findByText(/application submitted/i)).toBeInTheDocument();
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
    expect(screen.getByDisplayValue('Saved funding request')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saved travel plan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saved funding need')).toBeInTheDocument();
  });
});
