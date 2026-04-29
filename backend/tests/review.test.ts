import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/app';

const prisma = new PrismaClient();

const trackedEmails = [
  'review.loop.organizer@example.com',
  'review.loop.applicant@example.com',
  'review.loop.reviewer@example.com',
  'review.flagged.organizer@example.com',
  'review.flagged.applicant@example.com',
  'review.flagged.reviewer@example.com',
  'review.missing.queue.organizer@example.com',
  'review.no-role.user@example.com',
];

const conferenceSlugs = [
  'review-loop-conf-2026',
  'review-flagged-conf-2026',
  'review-missing-queue-conf-2026',
];

const safeExecute = async (sql: string) => {
  try {
    await prisma.$executeRawUnsafe(sql);
  } catch {
    // Ignore cleanup failures when the target table has not been introduced yet.
  }
};

const cleanupReviewFixtures = async () => {
  await safeExecute('DELETE FROM "Review";');
  await safeExecute('DELETE FROM "ReviewAssignment";');
  await safeExecute('DELETE FROM "Decision";');
  await safeExecute('DELETE FROM "UserRole";');

  await prisma.applicationStatusHistory.deleteMany({
    where: {
      application: {
        conference: {
          slug: { in: conferenceSlugs },
        },
      },
    },
  });

  await prisma.application.deleteMany({
    where: {
      conference: {
        slug: { in: conferenceSlugs },
      },
    },
  });

  await prisma.conferenceStaff.deleteMany({
    where: {
      conference: {
        slug: { in: conferenceSlugs },
      },
    },
  });

  await prisma.conference.deleteMany({
    where: {
      slug: { in: conferenceSlugs },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: { in: trackedEmails },
    },
  });
};

const registerUser = async (email: string, fullName: string) => {
  const response = await request(app).post('/api/v1/auth/register').send({
    email,
    password: 'password123',
    fullName,
  });

  expect(response.status).toBe(201);
  return {
    userId: response.body.user.id as string,
    token: response.body.accessToken as string,
  };
};

const promoteReviewer = async (userId: string) => {
  await prisma.userRole.create({
    data: {
      id: `role-${userId}`,
      userId,
      role: 'reviewer',
      isPrimary: false,
    },
  });
};

const createPublishedConference = async (organizerToken: string, slug: string, title: string) => {
  const createRes = await request(app)
    .post('/api/v1/organizer/conferences')
    .set('Authorization', `Bearer ${organizerToken}`)
    .send({
      slug,
      title,
      short_name: title.slice(0, 12),
      location_text: 'Singapore',
      start_date: '2026-09-10',
      end_date: '2026-09-14',
      description: `${title} description`,
      application_deadline: '2026-08-15T23:59:59Z',
      application_form_schema: {
        fields: [
          { key: 'participation_type', type: 'select', required: true },
          { key: 'statement', type: 'textarea', required: true },
          { key: 'abstract_title', type: 'text', required: false },
          { key: 'abstract_text', type: 'textarea', required: false },
        ],
      },
      settings: {},
    });

  expect(createRes.status).toBe(201);

  const conferenceId = createRes.body.data.conference.id as string;

  const publishRes = await request(app)
    .post(`/api/v1/organizer/conferences/${conferenceId}/publish`)
    .set('Authorization', `Bearer ${organizerToken}`)
    .send({});

  expect(publishRes.status).toBe(200);
  return conferenceId;
};

const submitConferenceApplication = async (
  applicantToken: string,
  conferenceId: string,
  fullName: string
) => {
  const profileRes = await request(app)
    .put('/api/v1/profile/me')
    .set('Authorization', `Bearer ${applicantToken}`)
    .send({
      full_name: fullName,
      title: null,
      institution_id: null,
      institution_name_raw: 'National University of Singapore',
      country_code: 'SG',
      career_stage: 'phd',
      bio: 'Working on algebraic geometry.',
      personal_website: 'https://example.com/review-applicant',
      research_keywords: ['algebraic geometry'],
      msc_codes: [],
      orcid_id: null,
      coi_declaration_text: '',
      is_profile_public: false,
    });

  expect(profileRes.status).toBe(200);

  const createRes = await request(app)
    .post(`/api/v1/conferences/${conferenceId}/applications`)
    .set('Authorization', `Bearer ${applicantToken}`)
    .send({
      participation_type: 'talk',
      statement: 'I would like to present new work.',
      abstract_title: 'A note on birational geometry',
      abstract_text: 'This talk discusses a compactness result.',
      interested_in_travel_support: true,
      extra_answers: {},
      file_ids: [],
    });

  expect(createRes.status).toBe(201);

  const applicationId = createRes.body.data.application.id as string;

  const submitRes = await request(app)
    .post(`/api/v1/me/applications/${applicationId}/submit`)
    .set('Authorization', `Bearer ${applicantToken}`)
    .send({});

  expect(submitRes.status).toBe(200);
  return applicationId;
};

describe('Review API', () => {
  beforeEach(async () => {
    await cleanupReviewFixtures();
  });

  afterAll(async () => {
    await cleanupReviewFixtures();
    await prisma.$disconnect();
  });

  it('runs the organizer -> reviewer -> decision -> release loop and keeps unreleased decisions applicant-safe', async () => {
    const organizer = await registerUser('review.loop.organizer@example.com', 'Review Loop Organizer');
    const applicant = await registerUser('review.loop.applicant@example.com', 'Review Loop Applicant');
    const reviewer = await registerUser('review.loop.reviewer@example.com', 'Prof Reviewer');

    await promoteReviewer(reviewer.userId);

    await prisma.profile.update({
      where: { userId: reviewer.userId },
      data: {
        fullName: 'Prof Reviewer',
        institutionNameRaw: 'University of Tokyo',
        countryCode: 'JP',
        careerStage: 'faculty',
        researchKeywordsJson: JSON.stringify(['algebraic geometry', 'moduli']),
      },
    });

    const conferenceId = await createPublishedConference(
      organizer.token,
      'review-loop-conf-2026',
      'Review Loop Conference 2026'
    );
    const applicationId = await submitConferenceApplication(
      applicant.token,
      conferenceId,
      'Review Loop Applicant'
    );

    const organizerListRes = await request(app)
      .get(`/api/v1/organizer/conferences/${conferenceId}/applications`)
      .set('Authorization', `Bearer ${organizer.token}`);

    expect(organizerListRes.status).toBe(200);
    expect(organizerListRes.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: applicationId,
          application_type: 'conference_application',
          status: 'submitted',
          review_assignment_count: 0,
          completed_review_count: 0,
          decision_release_status: null,
        }),
      ])
    );

    const candidateRes = await request(app)
      .get(`/api/v1/organizer/applications/${applicationId}/reviewer-candidates`)
      .set('Authorization', `Bearer ${organizer.token}`);

    expect(candidateRes.status).toBe(200);
    expect(candidateRes.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: reviewer.userId,
          full_name: 'Prof Reviewer',
          eligible_for_review: true,
        }),
      ])
    );

    const assignRes = await request(app)
      .post(`/api/v1/organizer/applications/${applicationId}/assign-reviewer`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({
        reviewer_user_id: reviewer.userId,
        due_at: '2026-08-30T23:59:59Z',
        conflict_state: 'clear',
        conflict_note: null,
      });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data.application_status).toBe('under_review');

    const assignmentId = assignRes.body.data.assignment.id as string;

    const reviewerQueueRes = await request(app)
      .get('/api/v1/reviewer/assignments')
      .set('Authorization', `Bearer ${reviewer.token}`);

    expect(reviewerQueueRes.status).toBe(200);
    expect(reviewerQueueRes.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assignment_id: assignmentId,
          application_id: applicationId,
          applicant_name: 'Review Loop Applicant',
          status: 'assigned',
          conflict_state: 'clear',
        }),
      ])
    );

    const reviewerDetailRes = await request(app)
      .get(`/api/v1/reviewer/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${reviewer.token}`);

    expect(reviewerDetailRes.status).toBe(200);
    expect(reviewerDetailRes.body.data.assignment).toMatchObject({
      id: assignmentId,
      conflict_state: 'clear',
      submission_blocked: false,
      application: {
        id: applicationId,
        application_type: 'conference_application',
        source_title: 'Review Loop Conference 2026',
        applicant_profile_snapshot: {
          full_name: 'Review Loop Applicant',
        },
      },
    });

    const reviewRes = await request(app)
      .post(`/api/v1/reviewer/assignments/${assignmentId}/review`)
      .set('Authorization', `Bearer ${reviewer.token}`)
      .send({
        score: 4,
        recommendation: 'accept',
        comment: 'Strong application with a clear research direction.',
      });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.review).toMatchObject({
      assignment_id: assignmentId,
      score: 4,
      recommendation: 'accept',
    });

    const decisionRes = await request(app)
      .post(`/api/v1/organizer/applications/${applicationId}/decision`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({
        final_status: 'accepted',
        note_internal: 'Priority candidate',
        note_external: 'We are pleased to inform you that your application has been accepted.',
      });

    expect(decisionRes.status).toBe(200);
    expect(decisionRes.body.data).toMatchObject({
      application_status: 'decided',
      decision: {
        application_id: applicationId,
        decision_kind: 'conference_admission',
        final_status: 'accepted',
        release_status: 'unreleased',
      },
    });

    const applicantDetailBeforeRelease = await request(app)
      .get(`/api/v1/me/applications/${applicationId}`)
      .set('Authorization', `Bearer ${applicant.token}`);

    expect(applicantDetailBeforeRelease.status).toBe(200);
    expect(applicantDetailBeforeRelease.body.data.application).toMatchObject({
      id: applicationId,
      application_type: 'conference_application',
      viewer_status: 'under_review',
      participation_type: 'talk',
      statement: 'I would like to present new work.',
      abstract_title: 'A note on birational geometry',
      abstract_text: 'This talk discusses a compactness result.',
      interested_in_travel_support: true,
      released_decision: null,
    });
    expect(applicantDetailBeforeRelease.body.data.application).not.toHaveProperty('decision');
    expect(applicantDetailBeforeRelease.body.data.application).not.toHaveProperty('status');

    const releaseRes = await request(app)
      .post(`/api/v1/organizer/applications/${applicationId}/release-decision`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({});

    expect(releaseRes.status).toBe(200);
    expect(releaseRes.body.data.decision).toMatchObject({
      application_id: applicationId,
      decision_kind: 'conference_admission',
      final_status: 'accepted',
      release_status: 'released',
    });

    const applicantDetailAfterRelease = await request(app)
      .get(`/api/v1/me/applications/${applicationId}`)
      .set('Authorization', `Bearer ${applicant.token}`);

    expect(applicantDetailAfterRelease.status).toBe(200);
    expect(applicantDetailAfterRelease.body.data.application).toMatchObject({
      id: applicationId,
      viewer_status: 'result_released',
      released_decision: {
        decision_kind: 'conference_admission',
        final_status: 'accepted',
        display_label: 'Accepted',
        note_external: 'We are pleased to inform you that your application has been accepted.',
      },
    });
  });

  it('returns 404 when organizer queue is requested for an unknown conference id', async () => {
    const organizer = await registerUser(
      'review.missing.queue.organizer@example.com',
      'Missing Queue Organizer'
    );

    await createPublishedConference(
      organizer.token,
      'review-missing-queue-conf-2026',
      'Review Missing Queue Conference 2026'
    );

    const response = await request(app)
      .get('/api/v1/organizer/conferences/not-a-real-conference/applications')
      .set('Authorization', `Bearer ${organizer.token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Conference not found');
  });

  it('rejects reviewer queue access for authenticated users without reviewer role', async () => {
    const nonReviewer = await registerUser(
      'review.no-role.user@example.com',
      'No Reviewer Role User'
    );

    const response = await request(app)
      .get('/api/v1/reviewer/assignments')
      .set('Authorization', `Bearer ${nonReviewer.token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Reviewer role required');
  });

  it('creates conflict-flagged assignments but blocks review submission', async () => {
    const organizer = await registerUser(
      'review.flagged.organizer@example.com',
      'Review Flagged Organizer'
    );
    const applicant = await registerUser(
      'review.flagged.applicant@example.com',
      'Review Flagged Applicant'
    );
    const reviewer = await registerUser(
      'review.flagged.reviewer@example.com',
      'Flagged Reviewer'
    );

    await promoteReviewer(reviewer.userId);

    const conferenceId = await createPublishedConference(
      organizer.token,
      'review-flagged-conf-2026',
      'Review Flagged Conference 2026'
    );
    const applicationId = await submitConferenceApplication(
      applicant.token,
      conferenceId,
      'Review Flagged Applicant'
    );

    const assignRes = await request(app)
      .post(`/api/v1/organizer/applications/${applicationId}/assign-reviewer`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({
        reviewer_user_id: reviewer.userId,
        due_at: '2026-08-30T23:59:59Z',
        conflict_state: 'flagged',
        conflict_note: 'Same institution as the applicant.',
      });

    expect(assignRes.status).toBe(200);
    const assignmentId = assignRes.body.data.assignment.id as string;

    const reviewerDetailRes = await request(app)
      .get(`/api/v1/reviewer/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${reviewer.token}`);

    expect(reviewerDetailRes.status).toBe(200);
    expect(reviewerDetailRes.body.data.assignment).toMatchObject({
      id: assignmentId,
      conflict_state: 'flagged',
      submission_blocked: true,
      conflict_note: 'Same institution as the applicant.',
    });

    const reviewRes = await request(app)
      .post(`/api/v1/reviewer/assignments/${assignmentId}/review`)
      .set('Authorization', `Bearer ${reviewer.token}`)
      .send({
        score: 2,
        recommendation: 'reject',
        comment: 'This should be blocked before review submission.',
      });

    expect(reviewRes.status).toBe(422);
    expect(reviewRes.body.message).toMatch(/conflict/i);
  });
});
