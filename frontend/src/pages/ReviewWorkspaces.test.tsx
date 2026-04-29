import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithRouter } from '../test/renderWithRouter';
import {
  resetReviewFakeState,
  seedReviewAssignment,
} from '../features/review/fakeReviewProvider';
import OrganizerApplicationDetail from './OrganizerApplicationDetail';
import OrganizerConferenceApplications from './OrganizerConferenceApplications';
import ReviewerAssignmentDetail from './ReviewerAssignmentDetail';
import ReviewerAssignments from './ReviewerAssignments';

describe('review workspaces', () => {
  beforeEach(() => {
    localStorage.clear();
    resetReviewFakeState();
  });

  it('renders the organizer conference application queue', async () => {
    localStorage.setItem('token', 'organizer-1');

    renderWithRouter(
      <OrganizerConferenceApplications />,
      '/organizer/conferences/review-conf-001/applications',
      '/organizer/conferences/:id/applications'
    );

    expect(await screen.findByRole('heading', { name: /conference applications/i })).toBeInTheDocument();
    expect(screen.getByText(/ada lovelace/i)).toBeInTheDocument();
    expect(screen.getByText(/review assignment count: 0/i)).toBeInTheDocument();
  });

  it('shows dashboard and portal header actions on the organizer queue', async () => {
    localStorage.setItem('token', 'organizer-1');

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/organizer/conferences/review-conf-001/applications',
            state: {
              returnContext: {
                to: '/dashboard',
                label: 'Back to dashboard',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route
            path="/organizer/conferences/:id/applications"
            element={<OrganizerConferenceApplications />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('link', { name: /back to dashboard/i })
    ).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /back to portal/i })).toHaveAttribute(
      'href',
      '/portal'
    );
    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();
  });

  it('lets the organizer assign a reviewer and release a decision', async () => {
    localStorage.setItem('token', 'organizer-1');
    const user = userEvent.setup();

    renderWithRouter(
      <OrganizerApplicationDetail />,
      '/organizer/applications/review-application-1',
      '/organizer/applications/:id'
    );

    expect(await screen.findByRole('heading', { name: /review application detail/i })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/reviewer/i), 'reviewer-1');
    await user.type(screen.getByLabelText(/review due/i), '2026-08-30T23:59:59.000Z');
    await user.click(screen.getByRole('button', { name: /assign reviewer/i }));

    expect(await screen.findByText(/internal assignment updated/i)).toBeInTheDocument();
    expect(screen.getAllByText(/prof reviewer/i).length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByLabelText(/final status/i), 'accepted');
    await user.type(screen.getByLabelText(/internal note/i), 'Priority candidate');
    await user.type(
      screen.getByLabelText(/external note/i),
      'We are pleased to inform you that your application has been accepted.'
    );
    await user.click(screen.getByRole('button', { name: /save decision/i }));

    expect(await screen.findByText(/internal decision saved/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /release decision/i }));
    expect(await screen.findByText(/decision released/i)).toBeInTheDocument();
    expect(screen.getAllByText(/release status: released/i).length).toBeGreaterThan(0);
  });

  it('shows queue and portal header actions on the organizer detail page', async () => {
    localStorage.setItem('token', 'organizer-1');

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/organizer/applications/review-application-1',
            state: {
              returnContext: {
                to: '/organizer/conferences/review-conf-001/applications',
                label: 'Back to conference queue',
                state: {
                  returnContext: {
                    to: '/dashboard',
                    label: 'Back to dashboard',
                  },
                },
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/organizer/applications/:id" element={<OrganizerApplicationDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('link', { name: /back to conference queue/i })
    ).toHaveAttribute('href', '/organizer/conferences/review-conf-001/applications');
    expect(screen.getByRole('link', { name: /back to portal/i })).toHaveAttribute(
      'href',
      '/portal'
    );
    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();
  });

  it('shows reviewer queue items and allows review submission for clear assignments', async () => {
    localStorage.setItem('token', 'reviewer-1');
    const assignmentId = seedReviewAssignment({
      applicationId: 'review-application-1',
      reviewerUserId: 'reviewer-1',
      conflictState: 'clear',
    });
    const user = userEvent.setup();

    renderWithRouter(<ReviewerAssignments />, '/reviewer', '/reviewer');
    expect(await screen.findByRole('heading', { name: /reviewer queue/i })).toBeInTheDocument();
    expect(screen.getByText(/review demo conference 2026/i)).toBeInTheDocument();

    renderWithRouter(
      <ReviewerAssignmentDetail />,
      `/reviewer/assignments/${assignmentId}`,
      '/reviewer/assignments/:id'
    );

    expect(await screen.findByRole('heading', { name: /review assignment/i })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/score/i), '4');
    await user.selectOptions(screen.getByLabelText(/recommendation/i), 'accept');
    await user.type(
      screen.getByLabelText(/review comment/i),
      'Strong application with a clear research direction.'
    );
    await user.click(screen.getByRole('button', { name: /submit review/i }));

    expect(await screen.findByText(/review submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/assignment status: review_submitted/i)).toBeInTheDocument();
    expect(screen.queryByText(/submission blocked/i)).not.toBeInTheDocument();
  });

  it('shows dashboard and portal header actions on the reviewer queue', async () => {
    localStorage.setItem('token', 'reviewer-1');
    localStorage.setItem(
      'asiamath.authUser',
      JSON.stringify({
        id: 'user-reviewer',
        email: 'reviewer@example.com',
        status: 'active',
        role: 'reviewer',
        roles: ['applicant', 'reviewer'],
        available_workspaces: ['applicant', 'reviewer'],
        primary_role: 'reviewer',
        createdAt: '2026-04-29T00:00:00.000Z',
        updatedAt: '2026-04-29T00:00:00.000Z',
      })
    );

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/reviewer',
            state: {
              returnContext: {
                to: '/dashboard',
                label: 'Back to dashboard',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/reviewer" element={<ReviewerAssignments />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: /back to dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard'
    );
    expect(screen.getByRole('link', { name: /back to portal/i })).toHaveAttribute(
      'href',
      '/portal'
    );
    expect(screen.getByRole('button', { name: /workspace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /browse opportunities/i })).not.toBeInTheDocument();
  });

  it('shows queue and portal header actions on the reviewer detail page', async () => {
    localStorage.setItem('token', 'reviewer-1');
    localStorage.setItem(
      'asiamath.authUser',
      JSON.stringify({
        id: 'user-reviewer',
        email: 'reviewer@example.com',
        status: 'active',
        role: 'reviewer',
        roles: ['applicant', 'reviewer'],
        available_workspaces: ['applicant', 'reviewer'],
        primary_role: 'reviewer',
        createdAt: '2026-04-29T00:00:00.000Z',
        updatedAt: '2026-04-29T00:00:00.000Z',
      })
    );
    const assignmentId = seedReviewAssignment({
      applicationId: 'review-application-1',
      reviewerUserId: 'reviewer-1',
      conflictState: 'clear',
    });

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: `/reviewer/assignments/${assignmentId}`,
            state: {
              returnContext: {
                to: '/reviewer',
                label: 'Back to reviewer queue',
                state: {
                  returnContext: {
                    to: '/dashboard',
                    label: 'Back to dashboard',
                  },
                },
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/reviewer/assignments/:id" element={<ReviewerAssignmentDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('link', { name: /back to reviewer queue/i })
    ).toHaveAttribute('href', '/reviewer');
    expect(screen.getByRole('link', { name: /back to portal/i })).toHaveAttribute(
      'href',
      '/portal'
    );
    expect(screen.getByRole('button', { name: /workspace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /browse opportunities/i })).not.toBeInTheDocument();
  });

  it('blocks non-reviewers from opening the reviewer queue shell', async () => {
    localStorage.setItem('token', 'organizer-1');

    renderWithRouter(<ReviewerAssignments />, '/reviewer', '/reviewer');

    expect(await screen.findByText(/reviewer role required/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /reviewer queue/i })).not.toBeInTheDocument();
  });

  it('surfaces conference-not-found when the organizer queue target is unknown', async () => {
    localStorage.setItem('token', 'organizer-1');

    renderWithRouter(
      <OrganizerConferenceApplications />,
      '/organizer/conferences/missing-review-conf/applications',
      '/organizer/conferences/:id/applications'
    );

    expect(await screen.findByText(/conference not found/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /conference applications/i })).not.toBeInTheDocument();
  });

  it('blocks reviewer submission when the assignment is conflict-flagged', async () => {
    localStorage.setItem('token', 'reviewer-1');
    const assignmentId = seedReviewAssignment({
      applicationId: 'review-application-1',
      reviewerUserId: 'reviewer-1',
      conflictState: 'flagged',
      conflictNote: 'Same institution as the applicant.',
    });

    renderWithRouter(
      <ReviewerAssignmentDetail />,
      `/reviewer/assignments/${assignmentId}`,
      '/reviewer/assignments/:id'
    );

    expect(await screen.findByText(/submission blocked/i)).toBeInTheDocument();
    expect(screen.getByText(/same institution as the applicant/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit review/i })).toBeDisabled();
  });
});
