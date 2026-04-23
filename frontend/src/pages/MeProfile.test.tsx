import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import MeProfile from './MeProfile';
import {
  resetProfileFakeState,
  seedProfileFakeState,
} from '../features/profile/fakeProfileProvider';

describe('me profile page', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'profile-demo-user');
    resetProfileFakeState();
  });

  it('explains the private editor boundary and offers a public scholar handoff when the profile is public', async () => {
    renderWithRouter(<MeProfile />, '/me/profile');

    expect(await screen.findByRole('heading', { name: /profile/i })).toBeInTheDocument();
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
});
