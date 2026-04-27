import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as authApi from '../api/auth';
import { renderWithRouter } from '../test/renderWithRouter';
import { resetDashboardFakeState, seedDashboardDemoState } from '../features/dashboard/fakeDashboardProvider';
import Dashboard from './Dashboard';

vi.mock('../api/auth', async () => {
  const actual = await vi.importActual<typeof import('../api/auth')>('../api/auth');

  return {
    ...actual,
    getMe: vi.fn(async () => ({
      user: {
        email: 'demo.applicant@asiamath.org',
        status: 'active',
        role: 'applicant',
      },
    })),
  };
});

const mockedGetMe = vi.mocked(authApi.getMe);

describe('Dashboard page', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDashboardFakeState();
    mockedGetMe.mockResolvedValue({
      user: {
        email: 'demo.applicant@asiamath.org',
        status: 'active',
        role: 'applicant',
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows a clear entry into the applications workspace even when no records exist', async () => {
    localStorage.setItem('token', 'dashboard-token');

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(
      screen.getByText(/open your application workspace to review records or start a submission/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open my applications/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
  });

  it('shows the seeded demo application summary and entry link', async () => {
    localStorage.setItem('token', 'dashboard-token');
    seedDashboardDemoState();

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(await screen.findByText(/review demo conference 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/1 active application in your workspace/i)).toBeInTheDocument();
    expect(screen.getByText('Under review')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open my applications/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
  });

  it('renders the shared applicant account menu and logs out to the portal', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'dashboard-token');

    function PortalProbe() {
      return <div>Portal destination</div>;
    }

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/portal" element={<PortalProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(await screen.findByRole('button', { name: 'Account' }));
    expect(screen.getByRole('link', { name: 'My Applications' })).toHaveAttribute(
      'href',
      '/me/applications'
    );
    expect(screen.getByRole('link', { name: 'My Profile' })).toHaveAttribute('href', '/me/profile');

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByText('Portal destination')).toBeInTheDocument();
  });

  it('shows presenter-safe continuation shortcuts for the demo flow', async () => {
    localStorage.setItem('token', 'dashboard-token');
    seedDashboardDemoState();

    renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

    expect(await screen.findByRole('heading', { name: /presenter-safe walkthrough/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue in my applications/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
    expect(screen.getByRole('link', { name: /restart from portal/i })).toHaveAttribute(
      'href',
      '/portal'
    );
  });
});
