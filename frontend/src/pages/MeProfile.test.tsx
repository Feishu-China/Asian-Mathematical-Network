import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { renderWithRouter } from '../test/renderWithRouter';
import MeProfile from './MeProfile';
import {
  resetProfileFakeState,
  seedProfileFakeState,
} from '../features/profile/fakeProfileProvider';
import { profileProvider } from '../features/profile/profileProvider';

function LoginStateProbe() {
  const location = useLocation();

  return <div>{JSON.stringify(location.state)}</div>;
}

describe('me profile page', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'profile-demo-user');
    resetProfileFakeState();
  });

  it('explains the private editor boundary and offers a public scholar handoff when the profile is public', async () => {
    localStorage.setItem(
      'asiamath.authUser',
      JSON.stringify({
        id: 'user-1',
        email: 'user@example.com',
        status: 'active',
        role: 'reviewer',
        roles: ['applicant', 'reviewer'],
        available_workspaces: ['applicant', 'reviewer'],
        primary_role: 'reviewer',
        createdAt: '2026-04-29T00:00:00.000Z',
        updatedAt: '2026-04-29T00:00:00.000Z',
      })
    );

    renderWithRouter(<MeProfile />, '/me/profile');

    expect(await screen.findByRole('heading', { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /workspace/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard'
    );
    expect(screen.getByText(/authenticated \/me surface/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /public scholar preview/i })).toBeInTheDocument();
    expect(screen.getByText('/scholars/alice-chen-demo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open public scholar page/i })).toHaveAttribute(
      'href',
      '/scholars/alice-chen-demo'
    );
    expect(
      screen.getByText(/coi declaration, verification state, and internal identifiers stay private/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/application, reviewer, and organizer contexts/i)
    ).toBeInTheDocument();
  });

  it('shows a hidden-public-view note when the profile is not public', async () => {
    seedProfileFakeState({ isProfilePublic: false });

    renderWithRouter(<MeProfile />, '/me/profile');

    expect(await screen.findByText(/public scholar page is currently hidden/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /public scholar preview/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /open public scholar page/i })).not.toBeInTheDocument();
  });

  it('shows an explicit saved state after profile changes are submitted', async () => {
    const user = userEvent.setup();

    renderWithRouter(<MeProfile />, '/me/profile');

    expect(await screen.findByRole('heading', { name: /profile/i })).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/position \/ title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Professor');
    await user.click(screen.getByRole('button', { name: /save profile/i }));

    expect(await screen.findByText('Profile changes saved')).toBeInTheDocument();
    expect(
      screen.getByText(/the private editor and public scholar preview now reflect the latest profile fields/i)
    ).toBeInTheDocument();
  });

  it('clears a stale session and redirects to /login when the profile request is unauthorized', async () => {
    const unauthorizedError = Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });
    vi.spyOn(profileProvider, 'getMyProfile').mockRejectedValueOnce(unauthorizedError);

    render(
      <MemoryRouter initialEntries={['/me/profile']}>
        <Routes>
          <Route path="/me/profile" element={<MeProfile />} />
          <Route path="/login" element={<LoginStateProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('{"returnTo":"/me/profile"}')).toBeInTheDocument();
    });
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('asiamath.authUser')).toBeNull();
  });
});
