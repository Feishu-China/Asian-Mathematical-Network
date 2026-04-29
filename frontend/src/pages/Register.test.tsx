import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import Register from './Register';

const registerMock = vi.hoisted(() => vi.fn());

vi.mock('../api/auth', async () => {
  const actual = await vi.importActual<typeof import('../api/auth')>('../api/auth');

  return {
    ...actual,
    register: registerMock,
  };
});

function ReturnStateProbe() {
  const location = useLocation();

  return <pre>{JSON.stringify(location.state)}</pre>;
}

function DestinationProbe({ label }: { label: string }) {
  return <div>{label}</div>;
}

const buildAuthResponse = () => ({
  accessToken: 'token-2',
  user: {
    id: 'user-2',
    email: 'ada@example.com',
    status: 'active' as const,
    role: 'applicant' as const,
    roles: ['applicant'] as const,
    available_workspaces: ['applicant'] as const,
    primary_role: 'applicant' as const,
    createdAt: '2026-04-29T00:00:00.000Z',
    updatedAt: '2026-04-29T00:00:00.000Z',
  },
});

describe('Register', () => {
  beforeEach(() => {
    localStorage.clear();
    registerMock.mockReset();
  });

  it('returns to the supplied route after sign up', async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValue(buildAuthResponse());

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/register',
            state: { returnTo: '/grants/example' },
          },
        ]}
      >
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/grants/example" element={<DestinationProbe label="Grant destination" />} />
          <Route path="/dashboard" element={<DestinationProbe label="Wrong destination" />} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Full Name'), 'Ada Lovelace');
    await user.type(screen.getByPlaceholderText('Email Address'), 'ada@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(registerMock).toHaveBeenCalledWith({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secret123',
    });
    expect(localStorage.getItem('token')).toBe('token-2');
    expect(await screen.findByText('Grant destination')).toBeInTheDocument();
  });

  it('defaults first-time sign up to the applicant workspace when no return target is supplied', async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValue(buildAuthResponse());

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<DestinationProbe label="Applicant destination" />} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Full Name'), 'Ada Lovelace');
    await user.type(screen.getByPlaceholderText('Email Address'), 'ada@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Applicant destination')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('asiamath.authUser') ?? '{}')).toMatchObject({
      available_workspaces: ['applicant'],
    });
  });

  it('preserves returnTo when switching to Login', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/register',
            state: { returnTo: '/grants/example' },
          },
        ]}
      >
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<ReturnStateProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('link', { name: 'Sign in' }));

    expect(screen.getAllByText('{"returnTo":"/grants/example"}').length).toBeGreaterThan(0);
  });
});
