import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { resetReviewFakeState } from '../features/review/fakeReviewProvider';
import { reviewProvider } from '../features/review/reviewProvider';
import MyApplicationDetail from './MyApplicationDetail';

describe('MyApplicationDetail page', () => {
  beforeEach(() => {
    localStorage.clear();
    resetReviewFakeState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an applicant-safe released result view for a single application', async () => {
    localStorage.setItem('token', 'organizer-1');
    await reviewProvider.upsertDecision('review-application-1', {
      finalStatus: 'accepted',
      noteInternal: 'Priority candidate',
      noteExternal: 'We are pleased to inform you that your application has been accepted.',
    });
    await reviewProvider.releaseDecision('review-application-1');

    localStorage.setItem('token', 'applicant-1');

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/me/applications/review-application-1',
            state: {
              returnContext: {
                to: '/me/applications',
                label: 'Back to applicant overview',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/me/applications/:id" element={<MyApplicationDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: 'Review Demo Conference 2026' })
    ).toBeInTheDocument();
    expect(screen.getByText('Role: Applicant')).toBeInTheDocument();
    expect(screen.getByText('Page mode: Hybrid')).toBeInTheDocument();
    expect(screen.getByText('Result released')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to applicant overview/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
    expect(screen.getByRole('heading', { name: /presenter shortcuts/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /restart from portal/i })).toHaveAttribute(
      'href',
      '/portal'
    );
    expect(
      screen.getByText('We are pleased to inform you that your application has been accepted.')
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /application summary/i })).toBeInTheDocument();
    expect(screen.queryByText(/internal status/i)).not.toBeInTheDocument();
  });

  it('renders a dedicated error state when the applicant detail request fails', async () => {
    localStorage.setItem('token', 'applicant-1');
    vi.spyOn(reviewProvider, 'getMyApplicationDetail').mockRejectedValueOnce(
      new Error('Backend unavailable')
    );

    render(
      <MemoryRouter initialEntries={['/me/applications/review-application-1']}>
        <Routes>
          <Route path="/me/applications/:id" element={<MyApplicationDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Application detail unavailable')).toBeInTheDocument();
    expect(screen.getByText(/we could not load this application detail right now/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to my applications/i })).toHaveAttribute(
      'href',
      '/me/applications'
    );
  });
});
