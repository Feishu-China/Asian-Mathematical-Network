import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import Login from './Login';

const loginMock = vi.hoisted(() => vi.fn());

vi.mock('../api/auth', async () => {
  const actual = await vi.importActual<typeof import('../api/auth')>('../api/auth');

  return {
    ...actual,
    login: loginMock,
  };
});

function ReturnStateProbe() {
  const location = useLocation();

  return <pre>{JSON.stringify(location.state)}</pre>;
}

function DestinationProbe({ label }: { label: string }) {
  return <div>{label}</div>;
}

const buildAuthResponse = (availableWorkspaces: Array<'applicant' | 'reviewer'>) => ({
  accessToken: 'token-1',
  user: {
    id: 'user-1',
    email: 'user@example.com',
    status: 'active' as const,
    role: availableWorkspaces.includes('reviewer') ? ('reviewer' as const) : ('applicant' as const),
    roles: availableWorkspaces,
    available_workspaces: availableWorkspaces,
    primary_role: availableWorkspaces.includes('reviewer')
      ? ('reviewer' as const)
      : ('applicant' as const),
    createdAt: '2026-04-29T00:00:00.000Z',
    updatedAt: '2026-04-29T00:00:00.000Z',
  },
});

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear();
    loginMock.mockReset();
  });

  it('returns to the supplied route after sign in', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue(buildAuthResponse(['applicant']));

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/login',
            state: { returnTo: '/schools' },
          },
        ]}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/schools" element={<DestinationProbe label="Schools destination" />} />
          <Route path="/dashboard" element={<DestinationProbe label="Wrong destination" />} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Email Address'), 'user@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(loginMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret123',
    });
    expect(localStorage.getItem('token')).toBe('token-1');
    expect(JSON.parse(localStorage.getItem('asiamath.authUser') ?? '{}')).toMatchObject({
      available_workspaces: ['applicant'],
    });
    expect(await screen.findByText('Schools destination')).toBeInTheDocument();
  });

  it('restores the last valid workspace when no explicit return target is supplied', async () => {
    const user = userEvent.setup();
    localStorage.setItem('asiamath.lastWorkspace', 'reviewer');
    loginMock.mockResolvedValue(buildAuthResponse(['applicant', 'reviewer']));

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reviewer" element={<DestinationProbe label="Reviewer destination" />} />
          <Route path="/dashboard" element={<DestinationProbe label="Wrong destination" />} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Email Address'), 'user@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Reviewer destination')).toBeInTheDocument();
  });

  it('falls back to applicant when the stored workspace is no longer allowed', async () => {
    const user = userEvent.setup();
    localStorage.setItem('asiamath.lastWorkspace', 'reviewer');
    loginMock.mockResolvedValue(buildAuthResponse(['applicant']));

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reviewer" element={<DestinationProbe label="Wrong destination" />} />
          <Route path="/dashboard" element={<DestinationProbe label="Applicant destination" />} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Email Address'), 'user@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Applicant destination')).toBeInTheDocument();
  });

  it('preserves returnTo when switching to Register', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/login',
            state: { returnTo: '/schools' },
          },
        ]}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<ReturnStateProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('link', { name: 'Sign up' }));

    expect(screen.getAllByText('{"returnTo":"/schools"}').length).toBeGreaterThan(0);
  });

  it('uses light-surface footer colors for the auth helper copy and link', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/pages/Auth.css'), 'utf8');

    expect(css).toMatch(/\.auth-footer\s*\{/);
    expect(css).toMatch(/\.auth-footer\s*\{[^}]*color:\s*var\(--color-text-muted\);/s);
    expect(css).toMatch(/\.auth-footer a\s*\{/);
    expect(css).toMatch(/\.auth-footer a\s*\{[^}]*color:\s*var\(--color-navy-700\);/s);
    expect(css).toMatch(/\.auth-footer a\s*\{[^}]*text-decoration-color:\s*rgba\(42,\s*70,\s*111,\s*0\.35\);/s);
  });
});
