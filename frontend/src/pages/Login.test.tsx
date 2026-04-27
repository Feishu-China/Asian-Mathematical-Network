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

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear();
    loginMock.mockReset();
  });

  it('returns to the supplied route after sign in', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({ accessToken: 'token-1' });

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
    expect(await screen.findByText('Schools destination')).toBeInTheDocument();
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
});
