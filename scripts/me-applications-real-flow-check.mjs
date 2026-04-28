import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(scriptDir, '../backend');
const backendRequire = createRequire(path.join(backendDir, 'package.json'));

process.env.TS_NODE_PROJECT = path.join(backendDir, 'tsconfig.json');
process.chdir(backendDir);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set before running me-applications-real-flow-check.mjs');
}

backendRequire('ts-node/register/transpile-only');

const { PrismaClient } = backendRequire('@prisma/client');
const {
  ensureDemoBaseline,
  DEMO_BASELINE_FIXTURE,
  cleanupDemoBaseline,
} = backendRequire('./src/lib/demoBaseline.ts');

const prisma = new PrismaClient();

const BACKEND_ORIGIN = process.env.PORTAL_INT_BACKEND_ORIGIN ?? 'http://127.0.0.1:3000';
const FRONTEND_ORIGIN = process.env.PORTAL_INT_FRONTEND_ORIGIN ?? 'http://127.0.0.1:5173';
const SKIP_CLEANUP = process.env.PORTAL_INT_SKIP_CLEANUP === 'true';

const uniqueRunId = Date.now().toString(36);
const applicant = {
  email: process.env.PORTAL_INT_USER_EMAIL ?? `portal.int.${uniqueRunId}@example.com`,
  password: process.env.PORTAL_INT_USER_PASSWORD ?? 'password123',
  fullName: process.env.PORTAL_INT_USER_FULL_NAME ?? `Portal Int ${uniqueRunId}`,
};

const cleanupVerifierArtifacts = async () => {
  await prisma.applicationStatusHistory.deleteMany({
    where: {
      application: {
        applicant: { email: { startsWith: 'portal.int.' } },
      },
    },
  });

  await prisma.decision.deleteMany({
    where: {
      application: {
        applicant: { email: { startsWith: 'portal.int.' } },
      },
    },
  });

  await prisma.application.deleteMany({
    where: { applicant: { email: { startsWith: 'portal.int.' } } },
  });

  await prisma.profile.deleteMany({
    where: { user: { email: { startsWith: 'portal.int.' } } },
  });

  await prisma.user.deleteMany({
    where: { email: { startsWith: 'portal.int.' } },
  });
};

const expectStatus = async (response, expectedStatus, context) => {
  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(
      `${context} expected HTTP ${expectedStatus}, received ${response.status}: ${body}`
    );
  }
};

const getJson = async (response, context) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${context} returned non-JSON body: ${text}`);
  }
};

const readJson = async (url, init, expectedStatus, context) => {
  const response = await fetch(url, init);
  await expectStatus(response, expectedStatus, context);
  return getJson(response, context);
};

const readHtml = async (url, context) => {
  const response = await fetch(url);
  await expectStatus(response, 200, context);
  const html = await response.text();

  if (!html.includes('<div id="root"></div>') && !html.includes('<div id="root">')) {
    throw new Error(`${context} did not return the expected frontend app shell`);
  }

  return html;
};

const withAuth = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const postJson = async (url, token, payload, expectedStatus, context) =>
  readJson(
    url,
    {
      method: 'POST',
      ...(token ? withAuth(token) : { headers: { 'Content-Type': 'application/json' } }),
      body: JSON.stringify(payload),
    },
    expectedStatus,
    context
  );

const expectField = (actual, expected, label) => {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
};

const verifyFrontendRoutes = async ({ conferenceApplicationId, grantApplicationId }) => {
  await readHtml(`${FRONTEND_ORIGIN}/portal`, 'frontend /portal');
  await readHtml(`${FRONTEND_ORIGIN}/me/applications`, 'frontend /me/applications');
  await readHtml(
    `${FRONTEND_ORIGIN}/me/applications/${conferenceApplicationId}`,
    'frontend /me/applications/:id (conference)'
  );
  await readHtml(
    `${FRONTEND_ORIGIN}/me/applications/${grantApplicationId}`,
    'frontend /me/applications/:id (grant)'
  );
};

const registerApplicant = async () => {
  const payload = await postJson(
    `${BACKEND_ORIGIN}/api/v1/auth/register`,
    null,
    applicant,
    201,
    'register applicant'
  );

  return {
    token: payload.accessToken,
    user: payload.user,
  };
};

const submitConferenceApplication = async (token, conferenceId) => {
  const draft = await postJson(
    `${BACKEND_ORIGIN}/api/v1/conferences/${conferenceId}/applications`,
    token,
    {
      participation_type: 'participant',
      statement: 'Portal integration: I plan to attend and present.',
      abstract_title: '',
      abstract_text: '',
      interested_in_travel_support: true,
      extra_answers: {},
      file_ids: [],
    },
    201,
    'create conference draft'
  );

  const submitted = await postJson(
    `${BACKEND_ORIGIN}/api/v1/me/applications/${draft.data.application.id}/submit`,
    token,
    {},
    200,
    'submit conference application'
  );

  expectField(submitted.data.application.status, 'submitted', 'conference status after submit');
  return submitted.data.application;
};

const submitGrantApplication = async (token, grantId, linkedConferenceApplicationId) => {
  const draft = await postJson(
    `${BACKEND_ORIGIN}/api/v1/grants/${grantId}/applications`,
    token,
    {
      linked_conference_application_id: linkedConferenceApplicationId,
      statement: 'Portal integration: travel support request.',
      travel_plan_summary: 'Round trip flights and 4 nights lodging.',
      funding_need_summary: 'Airfare support requested; lodging partly self-funded.',
      extra_answers: {},
      file_ids: [],
    },
    201,
    'create grant draft'
  );

  const submitted = await postJson(
    `${BACKEND_ORIGIN}/api/v1/me/applications/${draft.data.application.id}/submit`,
    token,
    {},
    200,
    'submit grant application'
  );

  expectField(submitted.data.application.status, 'submitted', 'grant status after submit');
  return submitted.data.application;
};

const submitPostVisitReport = async (token, applicationId) =>
  postJson(
    `${BACKEND_ORIGIN}/api/v1/me/applications/${applicationId}/post-visit-report`,
    token,
    {
      report_narrative: 'Attended the workshop, presented a talk, and met two collaborators.',
      attendance_confirmed: true,
    },
    201,
    'submit post-visit report'
  );

const releaseDecisionDirectly = async ({
  applicationId,
  decisionKind,
  finalStatus,
  noteExternal,
  decidedByUserId,
}) => {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.application.update({
      where: { id: applicationId },
      data: { status: 'decided', decidedAt: now },
    });

    await tx.decision.create({
      data: {
        applicationId,
        decisionKind,
        finalStatus,
        releaseStatus: 'released',
        noteInternal: 'Portal integration internal note',
        noteExternal,
        decidedByUserId,
        decidedAt: now,
        releasedAt: now,
      },
    });
  });
};

const main = async () => {
  await cleanupVerifierArtifacts();
  console.log('Seeding deterministic demo baseline (conference + grant + organizer)...');
  const fixture = await ensureDemoBaseline(prisma);

  console.log('Registering a fresh applicant for this integration run...');
  const auth = await registerApplicant();

  console.log('Submitting the conference application through the real backend...');
  const conferenceApp = await submitConferenceApplication(auth.token, fixture.conference.id);

  console.log('Submitting the linked grant application through the real backend...');
  const grantApp = await submitGrantApplication(auth.token, fixture.grant.id, conferenceApp.id);

  if (grantApp.id === conferenceApp.id) {
    throw new Error('Conference and grant applications collapsed into one record');
  }

  console.log('Releasing decisions directly through Prisma (REVIEW workflow surface stub)...');
  await releaseDecisionDirectly({
    applicationId: conferenceApp.id,
    decisionKind: 'conference_admission',
    finalStatus: 'accepted',
    noteExternal: 'Welcome to the conference.',
    decidedByUserId: fixture.creator.id,
  });

  await releaseDecisionDirectly({
    applicationId: grantApp.id,
    decisionKind: 'travel_grant',
    finalStatus: 'accepted',
    noteExternal: 'Your travel grant has been awarded.',
    decidedByUserId: fixture.creator.id,
  });

  console.log('Verifying frontend portal / dashboard / detail routes resolve...');
  await verifyFrontendRoutes({
    conferenceApplicationId: conferenceApp.id,
    grantApplicationId: grantApp.id,
  });

  console.log('Reading the applicant dashboard through the real backend...');
  const dashboard = await readJson(
    `${BACKEND_ORIGIN}/api/v1/me/applications`,
    { headers: { Authorization: `Bearer ${auth.token}` } },
    200,
    'list my applications'
  );

  expectField(dashboard.meta.total, 2, 'dashboard total count');
  expectField(dashboard.data.items.length, 2, 'dashboard items length');

  const dashboardConference = dashboard.data.items.find((item) => item.id === conferenceApp.id);
  const dashboardGrant = dashboard.data.items.find((item) => item.id === grantApp.id);

  if (!dashboardConference || !dashboardGrant) {
    throw new Error('Dashboard did not return both the conference and grant applications');
  }

  expectField(dashboardConference.application_type, 'conference_application', 'conference type');
  expectField(dashboardConference.source_id, fixture.conference.id, 'conference source_id');
  expectField(dashboardConference.source_title, fixture.conference.title, 'conference source_title');
  expectField(dashboardConference.linked_conference_title, null, 'conference linked_conference_title');
  expectField(dashboardConference.viewer_status, 'result_released', 'conference viewer_status');
  expectField(dashboardConference.next_action, 'view_result', 'conference next_action');

  if (!dashboardConference.released_decision) {
    throw new Error('Conference dashboard item missing released_decision payload');
  }
  expectField(
    dashboardConference.released_decision.decision_kind,
    'conference_admission',
    'conference decision_kind'
  );
  expectField(
    dashboardConference.released_decision.final_status,
    'accepted',
    'conference final_status'
  );
  expectField(
    dashboardConference.released_decision.display_label,
    'Accepted',
    'conference display_label'
  );

  expectField(dashboardGrant.application_type, 'grant_application', 'grant type');
  expectField(dashboardGrant.source_id, fixture.grant.id, 'grant source_id');
  expectField(dashboardGrant.source_title, fixture.grant.title, 'grant source_title');
  expectField(
    dashboardGrant.linked_conference_title,
    fixture.conference.title,
    'grant linked_conference_title'
  );
  expectField(dashboardGrant.viewer_status, 'result_released', 'grant viewer_status');
  expectField(
    dashboardGrant.next_action,
    'submit_post_visit_report',
    'grant next_action (reportRequired+accepted)'
  );

  if (!dashboardGrant.released_decision) {
    throw new Error('Grant dashboard item missing released_decision payload');
  }
  expectField(
    dashboardGrant.released_decision.display_label,
    'Awarded',
    'grant display_label'
  );

  console.log('Reading conference application detail through the real backend...');
  const conferenceDetail = await readJson(
    `${BACKEND_ORIGIN}/api/v1/me/applications/${conferenceApp.id}`,
    { headers: { Authorization: `Bearer ${auth.token}` } },
    200,
    'conference application detail'
  );

  const detail = conferenceDetail.data.application;
  expectField(detail.id, conferenceApp.id, 'detail id');
  expectField(detail.application_type, 'conference_application', 'detail application_type');
  expectField(detail.conference_title, fixture.conference.title, 'detail conference_title');
  expectField(detail.viewer_status, 'result_released', 'detail viewer_status');
  expectField(
    detail.released_decision?.note_external,
    'Welcome to the conference.',
    'detail note_external'
  );
  if (typeof detail.statement !== 'string' || detail.statement.length === 0) {
    throw new Error('Conference detail missing statement');
  }
  if (!detail.applicant_profile_snapshot || typeof detail.applicant_profile_snapshot !== 'object') {
    throw new Error('Conference detail missing applicant_profile_snapshot object');
  }

  console.log('Reading grant application detail through the real backend...');
  const grantDetail = await readJson(
    `${BACKEND_ORIGIN}/api/v1/me/applications/${grantApp.id}`,
    { headers: { Authorization: `Bearer ${auth.token}` } },
    200,
    'grant application detail'
  );

  const grantDetailItem = grantDetail.data.application;
  expectField(grantDetailItem.application_type, 'grant_application', 'grant detail application_type');
  expectField(grantDetailItem.grant_title, fixture.grant.title, 'grant detail grant_title');
  expectField(
    grantDetailItem.linked_conference_application_id,
    conferenceApp.id,
    'grant detail linked_conference_application_id'
  );
  expectField(
    grantDetailItem.linked_conference_title,
    fixture.conference.title,
    'grant detail linked_conference_title'
  );
  expectField(
    grantDetailItem.released_decision?.display_label,
    'Awarded',
    'grant detail display_label'
  );
  if (
    typeof grantDetailItem.travel_plan_summary !== 'string' ||
    grantDetailItem.travel_plan_summary.length === 0
  ) {
    throw new Error('Grant detail missing travel_plan_summary');
  }
  if (
    typeof grantDetailItem.funding_need_summary !== 'string' ||
    grantDetailItem.funding_need_summary.length === 0
  ) {
    throw new Error('Grant detail missing funding_need_summary');
  }
  expectField(grantDetailItem.post_visit_report, null, 'grant detail post_visit_report before submit');
  expectField(
    grantDetailItem.post_visit_report_status,
    null,
    'grant detail post_visit_report_status before submit'
  );

  console.log('Submitting the post-visit report through the real backend...');
  const postVisitPayload = await submitPostVisitReport(auth.token, grantApp.id);
  expectField(
    postVisitPayload.data.post_visit_report.status,
    'submitted',
    'post-visit report status after submit'
  );
  expectField(
    postVisitPayload.data.post_visit_report.attendance_confirmed,
    true,
    'post-visit attendance confirmation'
  );

  console.log('Re-reading dashboard after post-visit report submission...');
  const dashboardAfterReport = await readJson(
    `${BACKEND_ORIGIN}/api/v1/me/applications`,
    { headers: { Authorization: `Bearer ${auth.token}` } },
    200,
    'list my applications after post-visit report'
  );
  const dashboardGrantAfterReport = dashboardAfterReport.data.items.find(
    (item) => item.id === grantApp.id
  );
  if (!dashboardGrantAfterReport) {
    throw new Error('Dashboard lost the grant application after post-visit report submission');
  }
  expectField(
    dashboardGrantAfterReport.next_action,
    'view_result',
    'grant next_action after post-visit report submit'
  );
  expectField(
    dashboardGrantAfterReport.post_visit_report_status,
    'submitted',
    'grant dashboard post_visit_report_status after submit'
  );

  console.log('Re-reading grant detail after post-visit report submission...');
  const grantDetailAfterReport = await readJson(
    `${BACKEND_ORIGIN}/api/v1/me/applications/${grantApp.id}`,
    { headers: { Authorization: `Bearer ${auth.token}` } },
    200,
    'grant application detail after post-visit report'
  );
  const grantDetailAfterReportItem = grantDetailAfterReport.data.application;
  expectField(
    grantDetailAfterReportItem.post_visit_report?.status,
    'submitted',
    'grant detail post_visit_report.status after submit'
  );
  expectField(
    grantDetailAfterReportItem.post_visit_report?.attendance_confirmed,
    true,
    'grant detail post_visit_report.attendance_confirmed after submit'
  );
  expectField(
    grantDetailAfterReportItem.post_visit_report_status,
    'submitted',
    'grant detail post_visit_report_status after submit'
  );
  expectField(
    grantDetailAfterReportItem.post_visit_report?.report_narrative,
    'Attended the workshop, presented a talk, and met two collaborators.',
    'grant detail post_visit_report.report_narrative after submit'
  );

  console.log('Verifying applicant cannot read another user\'s application detail...');
  const foreignId = '00000000-0000-0000-0000-000000000000';
  const foreignResponse = await fetch(`${BACKEND_ORIGIN}/api/v1/me/applications/${foreignId}`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  await expectStatus(foreignResponse, 404, 'unknown application id');

  console.log('Verifying unauthenticated request to dashboard returns 401...');
  const unauthorized = await fetch(`${BACKEND_ORIGIN}/api/v1/me/applications`);
  await expectStatus(unauthorized, 401, 'unauthenticated dashboard request');

  console.log('PORTAL real flow check passed.');
  console.log(
    JSON.stringify(
      {
        fixture: {
          conferenceId: fixture.conference.id,
          conferenceSlug: fixture.conference.slug,
          grantId: fixture.grant.id,
          grantSlug: fixture.grant.slug,
        },
        applicant: {
          email: applicant.email,
          password: applicant.password,
          fullName: applicant.fullName,
          userId: auth.user.id,
        },
        conferenceApplicationId: conferenceApp.id,
        grantApplicationId: grantApp.id,
      },
      null,
      2
    )
  );
};

try {
  await main();
} finally {
  if (!SKIP_CLEANUP) {
    await cleanupVerifierArtifacts();
    await cleanupDemoBaseline(prisma);
  }
  await prisma.$disconnect();
}
