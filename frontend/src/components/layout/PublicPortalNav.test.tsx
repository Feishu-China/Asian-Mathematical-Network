import { beforeEach, describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { renderWithRouter } from '../../test/renderWithRouter';
import { PublicPortalNav } from './PublicPortalNav';

function ReturnStateProbe() {
  const location = useLocation();
  return <pre>{JSON.stringify(location.state)}</pre>;
}

describe('PublicPortalNav', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders public links and a resources dropdown for signed-out visitors', async () => {
    const user = userEvent.setup();

    renderWithRouter(<PublicPortalNav />, '/portal', '/portal');

    expect(screen.getByRole('link', { name: 'Conferences' })).toHaveAttribute(
      'href',
      '/conferences'
    );
    expect(screen.getByRole('link', { name: 'Travel Grants' })).toHaveAttribute(
      'href',
      '/grants'
    );
    expect(screen.getByRole('link', { name: 'Schools' })).toHaveAttribute('href', '/schools');
    expect(screen.getByRole('link', { name: 'Prizes' })).toHaveAttribute('href', '/prizes');
    expect(screen.getByRole('link', { name: 'Scholars' })).toHaveAttribute('href', '/scholars');
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');

    await user.click(screen.getByRole('button', { name: 'Resources' }));

    expect(screen.getByRole('link', { name: 'Newsletter' })).toHaveAttribute(
      'href',
      '/newsletter'
    );
    expect(screen.getByRole('link', { name: 'Videos' })).toHaveAttribute('href', '/videos');
    expect(screen.getByRole('link', { name: 'Publications' })).toHaveAttribute(
      'href',
      '/publications'
    );
  });

  it('shows an account menu instead of Sign in for authenticated applicants', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'applicant-1');

    render(
      <MemoryRouter initialEntries={['/portal']}>
        <Routes>
          <Route path="/portal" element={<PublicPortalNav />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Account' }));

    expect(screen.getByRole('link', { name: 'My Applications' })).toHaveAttribute(
      'href',
      '/me/applications'
    );
    expect(screen.getByRole('link', { name: 'My Profile' })).toHaveAttribute('href', '/me/profile');
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('logs out from the portal account menu and returns to the signed-out nav state', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'applicant-1');

    render(
      <MemoryRouter initialEntries={['/portal']}>
        <Routes>
          <Route path="/portal" element={<PublicPortalNav />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Account' }));
    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });

  it('passes a portal return context through top-level public nav links clicked from the homepage', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/portal']}>
        <Routes>
          <Route path="/portal" element={<PublicPortalNav />} />
          <Route path="/schools" element={<ReturnStateProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('link', { name: 'Schools' }));

    expect(screen.getByText(/"to":"\/portal"/)).toBeInTheDocument();
    expect(screen.getByText(/"label":"Back to portal"/)).toBeInTheDocument();
  });
});
