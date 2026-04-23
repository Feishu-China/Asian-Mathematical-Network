import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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

  it('renders the demo reviewer profile and preserves a return link from partners', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/scholars/prof-reviewer',
            state: {
              returnContext: {
                to: '/partners',
                label: 'Back to partners',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/scholars/:slug" element={<ScholarProfile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Back to partners')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to partners/i })).toHaveAttribute(
      'href',
      '/partners'
    );
    expect(
      screen.getByText(
        /sample public scholar profile used across the directory, reviewer, and partner-matching demos/i
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Prof Reviewer' })).toBeInTheDocument();
    expect(screen.getByText(/review governance, algebraic geometry, and cross-border mathematical collaboration/i)).toBeInTheDocument();
    expect(screen.getByText('/scholars/prof-reviewer')).toBeInTheDocument();
    expect(screen.queryByText(/profile unavailable/i)).not.toBeInTheDocument();
  });

  it('preserves a return link from prize detail when scholar context is opened there', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/scholars/prof-reviewer',
            state: {
              returnContext: {
                to: '/prizes/asiamath-early-career-prize-2026',
                label: 'Back to prize',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/scholars/:slug" element={<ScholarProfile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: /back to prize/i })).toHaveAttribute(
      'href',
      '/prizes/asiamath-early-career-prize-2026'
    );
  });
});
