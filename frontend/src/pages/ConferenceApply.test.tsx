import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { renderWithRouter } from '../test/renderWithRouter';
import {
  fakeConferenceProvider,
  resetConferenceFakeState,
} from '../features/conference/fakeConferenceProvider';
import Conferences from './Conferences';
import ConferenceDetail from './ConferenceDetail';
import ConferenceApply from './ConferenceApply';

function LoginStateProbe() {
  const location = useLocation();

  return <div>{JSON.stringify(location.state)}</div>;
}

const hasExactText = (expected: string) => (_content: string, element: Element | null) =>
  element?.textContent?.replace(/\s+/g, ' ').trim() === expected;

describe('conference apply page', () => {
  beforeEach(() => {
    localStorage.clear();
    resetConferenceFakeState();
  });

  it('shows an authentication prompt when no token is present', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/conferences/asiamath-2026-workshop/apply']}>
        <Routes>
          <Route path="/conferences/:slug/apply" element={<ConferenceApply />} />
          <Route path="/login" element={<LoginStateProbe />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/sign in to start a conference application/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /go to login/i }));

    expect(
      screen.getByText('{"returnTo":"/conferences/asiamath-2026-workshop/apply"}')
    ).toBeInTheDocument();
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

  it('shows required markers for base and talk-specific fields', async () => {
    localStorage.setItem('token', 'applicant-1');

    renderWithRouter(
      <ConferenceApply />,
      '/conferences/asiamath-2026-workshop/apply',
      '/conferences/:slug/apply'
    );

    await screen.findByRole('heading', { name: /conference application/i });

    expect(screen.getAllByText(hasExactText('Participation type *'))[0]).toBeInTheDocument();
    expect(screen.getAllByText(hasExactText('Statement *'))[0]).toBeInTheDocument();
    expect(screen.getAllByText(hasExactText('Abstract title (required for talk)'))[0]).toBeInTheDocument();
    expect(screen.getAllByText(hasExactText('Abstract text (required for talk)'))[0]).toBeInTheDocument();
  });

  it('explains why submit is disabled before saving and when talk abstract fields are incomplete', async () => {
    localStorage.setItem('token', 'applicant-1');
    const user = userEvent.setup();

    renderWithRouter(
      <ConferenceApply />,
      '/conferences/asiamath-2026-workshop/apply',
      '/conferences/:slug/apply'
    );

    await screen.findByRole('heading', { name: /conference application/i });

    expect(screen.getByText(/save this draft once before submitting/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/participation type/i), 'talk');
    await user.type(screen.getByLabelText(/statement/i), 'I want to present new work.');
    await user.type(screen.getByLabelText(/abstract title/i), 'A New Theorem');
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    expect(await screen.findByText(/draft saved/i)).toBeInTheDocument();
    expect(
      screen.getByText(/abstract text is required for talk submissions/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit application/i })).toBeDisabled();
  });

  it('renders the shared applicant account menu for signed-in applicants', async () => {
    localStorage.setItem('token', 'applicant-1');

    renderWithRouter(
      <ConferenceApply />,
      '/conferences/asiamath-2026-workshop/apply',
      '/conferences/:slug/apply'
    );

    await screen.findByRole('heading', { name: /conference application/i });
    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();
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

    expect(
      await screen.findByText(/this conference application draft is already on file/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Draft saved$/i)).not.toBeInTheDocument();
    expect(await screen.findByDisplayValue('talk')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saved statement')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saved abstract title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saved abstract text')).toBeInTheDocument();
    expect(screen.getByLabelText(/interested in travel support/i)).toBeChecked();
  });

  it('shows a submitted-state notice and locks editing after a submitted application reloads', async () => {
    localStorage.setItem('token', 'applicant-1');

    const created = await fakeConferenceProvider.createConferenceApplication('conf-published-001', {
      participationType: 'talk',
      statement: 'Submitted statement',
      abstractTitle: 'Submitted abstract title',
      abstractText: 'Submitted abstract text',
      interestedInTravelSupport: true,
      extraAnswers: {},
    });
    await fakeConferenceProvider.submitConferenceApplication(created.id);

    renderWithRouter(
      <ConferenceApply />,
      '/conferences/asiamath-2026-workshop/apply',
      '/conferences/:slug/apply'
    );

    expect(await screen.findByText(/submitted and under review/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/this conference application draft is already on file/i)
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save draft/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /submit application/i })).toBeDisabled();
    expect(screen.getByLabelText(/statement/i)).toBeDisabled();
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

  it('preserves the portal-origin return path through conference apply and back out to the list', async () => {
    localStorage.setItem('token', 'applicant-1');
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/conferences',
            state: {
              returnContext: {
                to: '/portal',
                label: 'Back to portal',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/conferences" element={<Conferences />} />
          <Route path="/conferences/:slug" element={<ConferenceDetail />} />
          <Route path="/conferences/:slug/apply" element={<ConferenceApply />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: /back to portal/i })).toHaveAttribute(
      'href',
      '/portal'
    );

    await user.click(screen.getAllByRole('link', { name: /view details/i })[0]);
    expect(await screen.findByRole('link', { name: /apply for conference/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /apply for conference/i }));
    expect(await screen.findByRole('link', { name: /back to conference detail/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /back to conference detail/i }));
    expect(await screen.findByRole('link', { name: /back to conferences/i })).toHaveAttribute(
      'href',
      '/conferences'
    );

    await user.click(screen.getByRole('link', { name: /back to conferences/i }));
    expect(await screen.findByRole('link', { name: /back to portal/i })).toHaveAttribute(
      'href',
      '/portal'
    );
  });
});
