import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test/renderWithRouter';
import {
  fakeConferenceProvider,
  resetConferenceFakeState,
} from '../features/conference/fakeConferenceProvider';
import ConferenceApply from './ConferenceApply';

describe('conference apply page', () => {
  beforeEach(() => {
    localStorage.clear();
    resetConferenceFakeState();
  });

  it('shows an authentication prompt when no token is present', async () => {
    renderWithRouter(
      <ConferenceApply />,
      '/conferences/asiamath-2026-workshop/apply',
      '/conferences/:slug/apply'
    );

    expect(await screen.findByText(/sign in to start a conference application/i)).toBeInTheDocument();
  });

  it('creates a draft and submits it for an authenticated applicant', async () => {
    localStorage.setItem('token', 'applicant-1');
    const user = userEvent.setup();

    renderWithRouter(
      <ConferenceApply />,
      '/conferences/asiamath-2026-workshop/apply',
      '/conferences/:slug/apply'
    );

    await screen.findByRole('heading', { name: /conference application/i });
    await user.selectOptions(screen.getByLabelText(/participation type/i), 'talk');
    await user.type(screen.getByLabelText(/statement/i), 'I want to present new work.');
    await user.type(screen.getByLabelText(/abstract title/i), 'A New Theorem');
    await user.type(screen.getByLabelText(/abstract text/i), 'We prove a new theorem.');
    await user.click(screen.getByLabelText(/interested in travel support/i));
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    expect(await screen.findByText(/draft saved/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /submit application/i }));
    expect(await screen.findByText(/application submitted/i)).toBeInTheDocument();
  });

  it('hydrates an existing draft when the page reloads', async () => {
    localStorage.setItem('token', 'applicant-1');

    await fakeConferenceProvider.createConferenceApplication('conf-published-001', {
      participationType: 'talk',
      statement: 'Saved statement',
      abstractTitle: 'Saved abstract title',
      abstractText: 'Saved abstract text',
      interestedInTravelSupport: true,
      extraAnswers: {},
    });

    renderWithRouter(
      <ConferenceApply />,
      '/conferences/asiamath-2026-workshop/apply',
      '/conferences/:slug/apply'
    );

    expect(await screen.findByText(/draft saved/i)).toBeInTheDocument();
    expect(await screen.findByDisplayValue('talk')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saved statement')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saved abstract title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saved abstract text')).toBeInTheDocument();
    expect(screen.getByLabelText(/interested in travel support/i)).toBeChecked();
  });

  it('updates an existing draft after the page reloads', async () => {
    localStorage.setItem('token', 'applicant-1');

    await fakeConferenceProvider.createConferenceApplication('conf-published-001', {
      participationType: 'participant',
      statement: 'Existing draft',
      abstractTitle: '',
      abstractText: '',
      interestedInTravelSupport: false,
      extraAnswers: {},
    });

    const user = userEvent.setup();
    renderWithRouter(
      <ConferenceApply />,
      '/conferences/asiamath-2026-workshop/apply',
      '/conferences/:slug/apply'
    );

    await screen.findByRole('heading', { name: /conference application/i });
    await user.clear(screen.getByLabelText(/statement/i));
    await user.type(screen.getByLabelText(/statement/i), 'Updated after reload');
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    expect(await screen.findByText(/draft saved/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Updated after reload')).toBeInTheDocument();
  });
});
