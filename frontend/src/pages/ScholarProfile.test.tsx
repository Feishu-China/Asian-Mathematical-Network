import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import ScholarProfile from './ScholarProfile';
import {
  resetProfileFakeState,
  seedProfileFakeState,
} from '../features/profile/fakeProfileProvider';

describe('scholar profile page', () => {
  beforeEach(() => {
    resetProfileFakeState();
  });

  it('renders a richer public scholar profile while keeping private-only fields off the page', async () => {
    seedProfileFakeState({
      slug: 'alice-chen-demo',
      coiDeclarationText: 'Internal only COI note',
      verificationStatus: 'verified',
    });

    renderWithRouter(<ScholarProfile />, '/scholars/alice-chen-demo', '/scholars/:slug');

    expect(await screen.findByRole('heading', { name: /scholar profile/i })).toBeInTheDocument();
    expect(screen.getByText(/public profile scope/i)).toBeInTheDocument();
    expect(screen.getByText('/scholars/alice-chen-demo')).toBeInTheDocument();
    expect(
      screen.getByText(/directory visibility and reviewer-source context reuse this same public profile surface/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/internal coi, verification, and account metadata stay off this page/i)).toBeInTheDocument();
    expect(screen.getByText(/research profile/i)).toBeInTheDocument();
    expect(screen.queryByText(/internal only coi note/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^verified$/i)).not.toBeInTheDocument();
  });

  it('explains why a scholar page is unavailable when visibility is disabled', async () => {
    seedProfileFakeState({
      slug: 'alice-chen-demo',
      isProfilePublic: false,
    });

    renderWithRouter(<ScholarProfile />, '/scholars/alice-chen-demo', '/scholars/:slug');

    expect(await screen.findByText(/not public or is unavailable/i)).toBeInTheDocument();
    expect(
      screen.getByText(/only profiles with public visibility enabled appear on this route/i)
    ).toBeInTheDocument();
  });
});
