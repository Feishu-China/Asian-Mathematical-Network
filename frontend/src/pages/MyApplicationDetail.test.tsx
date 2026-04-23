import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import { resetReviewFakeState } from '../features/review/fakeReviewProvider';
import { reviewProvider } from '../features/review/reviewProvider';
import MyApplicationDetail from './MyApplicationDetail';

describe('MyApplicationDetail page', () => {
  beforeEach(() => {
    localStorage.clear();
    resetReviewFakeState();
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

    renderWithRouter(
      <MyApplicationDetail />,
      '/me/applications/review-application-1',
      '/me/applications/:id'
    );

    expect(
      await screen.findByRole('heading', { name: 'Review Demo Conference 2026' })
    ).toBeInTheDocument();
    expect(screen.getByText('Role: Applicant')).toBeInTheDocument();
    expect(screen.getByText('Page mode: Hybrid')).toBeInTheDocument();
    expect(screen.getByText('Result released')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(
      screen.getByText('We are pleased to inform you that your application has been accepted.')
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /application summary/i })).toBeInTheDocument();
    expect(screen.queryByText(/internal status/i)).not.toBeInTheDocument();
  });
});
