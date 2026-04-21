import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test/renderWithRouter';
import { resetConferenceFakeState } from '../features/conference/fakeConferenceProvider';
import OrganizerConferenceNew from './OrganizerConferenceNew';
import OrganizerConferenceEditor from './OrganizerConferenceEditor';

describe('organizer conference editor pages', () => {
  beforeEach(() => {
    localStorage.clear();
    resetConferenceFakeState();
    localStorage.setItem('token', 'organizer-1');
  });

  it('creates a new draft conference from the organizer new page', async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <OrganizerConferenceNew />,
      '/organizer/conferences/new',
      '/organizer/conferences/new'
    );

    await user.type(screen.getByLabelText(/title/i), 'Operator Algebra Summit');
    await user.type(screen.getByLabelText(/slug/i), 'operator-algebra-summit');
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    expect(await screen.findByText(/draft saved/i)).toBeInTheDocument();
  });

  it('keeps publish disabled until required fields are present, then allows publish and close', async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <OrganizerConferenceEditor />,
      '/organizer/conferences/conf-draft-001',
      '/organizer/conferences/:id'
    );

    const publishButton = await screen.findByRole('button', { name: /publish conference/i });
    expect(publishButton).toBeDisabled();

    await user.type(screen.getByLabelText(/location/i), 'Seoul');
    await user.type(screen.getByLabelText(/start date/i), '2026-10-11');
    await user.type(screen.getByLabelText(/end date/i), '2026-10-15');
    await user.type(screen.getByLabelText(/description/i), 'A publish-ready draft.');
    await user.type(
      screen.getByLabelText(/application deadline/i),
      '2026-09-15T23:59:59.000Z'
    );

    expect(screen.getByRole('button', { name: /publish conference/i })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /publish conference/i }));
    expect(await screen.findByText(/status: published/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close conference/i }));
    expect(await screen.findByText(/status: closed/i)).toBeInTheDocument();
  });
});
