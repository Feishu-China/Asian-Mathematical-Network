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
  throw new Error('DATABASE_URL must be set before running grant-real-flow-check.mjs');
}

backendRequire('ts-node/register/transpile-only');

const { PrismaClient } = backendRequire('@prisma/client');
const {
  ensureDemoBaseline,
  DEMO_BASELINE_FIXTURE,
  cleanupDemoBaseline,
} = backendRequire('./src/lib/demoBaseline.ts');

const prisma = new PrismaClient();

const BACKEND_ORIGIN = process.env.GRANT_INT_BACKEND_ORIGIN ?? 'http://127.0.0.1:3000';
const FRONTEND_ORIGIN = process.env.GRANT_INT_FRONTEND_ORIGIN ?? 'http://127.0.0.1:5173';

const uniqueRunId = Date.now().toString(36);
const applicant = {
  email: `grant.int.${uniqueRunId}@example.com`,
  password: 'password123',
  fullName: `Grant Int ${uniqueRunId}`,
};

const cleanupVerifierArtifacts = async () => {
  await prisma.applicationStatusHistory.deleteMany({
    where: {
      application: {
        applicant: {
          email: {
            startsWith: 'grant.int.',
          },
        },
      },
    },
  });

  await prisma.application.deleteMany({
    where: {
      applicant: {
        email: {
          startsWith: 'grant.int.',
        },
      },
    },
  });

  await prisma.profile.deleteMany({
    where: {
      user: {
        email: {
          startsWith: 'grant.int.',
        },
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: 'grant.int.',
      },
    },
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

const putJson = async (url, token, payload, expectedStatus, context) =>
  readJson(
    url,
    {
      method: 'PUT',
      ...withAuth(token),
      body: JSON.stringify(payload),
    },
    expectedStatus,
    context
  );

const verifyFrontendRoutes = async () => {
  await readHtml(`${FRONTEND_ORIGIN}/grants`, 'frontend /grants');
  await readHtml(
    `${FRONTEND_ORIGIN}/grants/${DEMO_BASELINE_FIXTURE.grantSlug}`,
    'frontend /grants/:slug'
  );
  await readHtml(
    `${FRONTEND_ORIGIN}/grants/${DEMO_BASELINE_FIXTURE.grantSlug}/apply`,
    'frontend /grants/:slug/apply'
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

const main = async () => {
  console.log('Grant integration origins:', {
    backendOrigin: BACKEND_ORIGIN,
    frontendOrigin: FRONTEND_ORIGIN,
  });
  if (!process.env.GRANT_INT_BACKEND_ORIGIN && !process.env.GRANT_INT_FRONTEND_ORIGIN) {
    console.log(
      'Grant real-flow note: default script origins follow local proxy-mode dev (3000/5173). ' +
        'For acceptance against the stable backend, rerun with GRANT_INT_BACKEND_ORIGIN=http://127.0.0.1:3001 ' +
        'GRANT_INT_FRONTEND_ORIGIN=http://127.0.0.1:5175 and start the frontend with ' +
        'VITE_API_BASE_URL=http://127.0.0.1:3001/api/v1.'
    );
  }
  await cleanupVerifierArtifacts();
  console.log('Seeding deterministic grant integration fixture...');
  const fixture = await ensureDemoBaseline(prisma);

  console.log('Verifying frontend grant routes resolve through the dev server...');
  await verifyFrontendRoutes();

  console.log('Reading public grant and conference data from the real backend...');
  const grantList = await readJson(
    `${BACKEND_ORIGIN}/api/v1/grants`,
    undefined,
    200,
    'list grants'
  );
  const grantItem = grantList.data.items.find(
    (item) => item.slug === DEMO_BASELINE_FIXTURE.grantSlug
  );

  if (!grantItem) {
    throw new Error('Published grant fixture was not returned by GET /api/v1/grants');
  }

  const grantDetail = await readJson(
    `${BACKEND_ORIGIN}/api/v1/grants/${DEMO_BASELINE_FIXTURE.grantSlug}`,
    undefined,
    200,
    'grant detail'
  );

  if (grantDetail.data.grant.linked_conference_id !== fixture.conference.id) {
    throw new Error('Grant detail did not expose the expected linked conference id');
  }

  console.log('Registering a fresh applicant for this integration run...');
  const auth = await registerApplicant();

  const conferenceDraft = await postJson(
    `${BACKEND_ORIGIN}/api/v1/conferences/${fixture.conference.id}/applications`,
    auth.token,
    {
      participation_type: 'participant',
      statement: 'Conference prerequisite statement for grant integration.',
      abstract_title: '',
      abstract_text: '',
      interested_in_travel_support: true,
      extra_answers: {},
      file_ids: [],
    },
    201,
    'create conference draft'
  );

  if (conferenceDraft.data.application.application_type !== 'conference_application') {
    throw new Error('Conference draft did not return conference_application payload');
  }

  console.log('Verifying grant draft creation is blocked before conference submission...');
  const blockedGrantDraftResponse = await fetch(
    `${BACKEND_ORIGIN}/api/v1/grants/${fixture.grant.id}/applications`,
    {
      method: 'POST',
      ...withAuth(auth.token),
      body: JSON.stringify({
        linked_conference_application_id: conferenceDraft.data.application.id,
        statement: 'Travel support request before conference submission.',
        travel_plan_summary: 'Initial travel plan.',
        funding_need_summary: 'Initial funding need.',
        extra_answers: {},
        file_ids: [],
      }),
    }
  );

  await expectStatus(
    blockedGrantDraftResponse,
    422,
    'blocked grant draft before conference submission'
  );

  const blockedGrantDraftBody = await getJson(
    blockedGrantDraftResponse,
    'blocked grant draft before conference submission'
  );

  if (!String(blockedGrantDraftBody.message).includes('submitted linked conference application')) {
    throw new Error('Grant prerequisite failure did not return the expected message');
  }

  console.log('Submitting the conference application through the real backend...');
  const submittedConference = await postJson(
    `${BACKEND_ORIGIN}/api/v1/me/applications/${conferenceDraft.data.application.id}/submit`,
    auth.token,
    {},
    200,
    'submit conference application'
  );

  if (submittedConference.data.application.status !== 'submitted') {
    throw new Error('Conference application was not submitted successfully');
  }

  const myConferenceApplication = await readJson(
    `${BACKEND_ORIGIN}/api/v1/conferences/${fixture.conference.id}/applications/me`,
    {
      headers: { Authorization: `Bearer ${auth.token}` },
    },
    200,
    'read my submitted conference application'
  );

  if (myConferenceApplication.data.application.id !== conferenceDraft.data.application.id) {
    throw new Error('Conference application hydrate did not return the expected application');
  }

  console.log('Creating, updating, and submitting the linked grant application...');
  const createdGrantDraft = await postJson(
    `${BACKEND_ORIGIN}/api/v1/grants/${fixture.grant.id}/applications`,
    auth.token,
    {
      linked_conference_application_id: conferenceDraft.data.application.id,
      statement: 'I am requesting travel support to attend the workshop.',
      travel_plan_summary: 'Round trip from Singapore with 4 nights lodging.',
      funding_need_summary: 'Airfare support requested; accommodation partially self-funded.',
      extra_answers: {},
      file_ids: [],
    },
    201,
    'create grant draft'
  );

  if (createdGrantDraft.data.application.application_type !== 'grant_application') {
    throw new Error('Grant draft did not return grant_application payload');
  }

  if (
    createdGrantDraft.data.application.linked_conference_application_id !==
    conferenceDraft.data.application.id
  ) {
    throw new Error('Grant draft did not preserve linked_conference_application_id');
  }

  const updatedGrantDraft = await putJson(
    `${BACKEND_ORIGIN}/api/v1/me/applications/${createdGrantDraft.data.application.id}/draft`,
    auth.token,
    {
      linked_conference_application_id: conferenceDraft.data.application.id,
      statement: 'Updated travel support request after conference submission.',
      travel_plan_summary: 'Updated travel plan with confirmed itinerary.',
      funding_need_summary: 'Updated funding need with partial self-funding.',
      extra_answers: { lodging: 'shared room' },
      file_ids: [],
    },
    200,
    'update grant draft'
  );

  if (updatedGrantDraft.data.application.status !== 'draft') {
    throw new Error('Grant draft update unexpectedly changed application status');
  }

  const submittedGrant = await postJson(
    `${BACKEND_ORIGIN}/api/v1/me/applications/${createdGrantDraft.data.application.id}/submit`,
    auth.token,
    {},
    200,
    'submit grant application'
  );

  if (submittedGrant.data.application.status !== 'submitted') {
    throw new Error('Grant application was not submitted successfully');
  }

  const myGrantApplication = await readJson(
    `${BACKEND_ORIGIN}/api/v1/grants/${fixture.grant.id}/applications/me`,
    {
      headers: { Authorization: `Bearer ${auth.token}` },
    },
    200,
    'read my submitted grant application'
  );

  if (myGrantApplication.data.application.id === myConferenceApplication.data.application.id) {
    throw new Error('Conference and grant applications collapsed into one record');
  }

  if (myGrantApplication.data.application.application_type !== 'grant_application') {
    throw new Error('Grant hydrate did not return a grant_application payload');
  }

  if (
    myGrantApplication.data.application.linked_conference_application_id !==
    myConferenceApplication.data.application.id
  ) {
    throw new Error('Grant hydrate lost the linked conference application id');
  }

  console.log('INT-GRANT-001 real flow check passed.');
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
          userId: auth.user.id,
        },
        conferenceApplicationId: myConferenceApplication.data.application.id,
        grantApplicationId: myGrantApplication.data.application.id,
      },
      null,
      2
    )
  );
};

try {
  await main();
} finally {
  await cleanupVerifierArtifacts();
  await cleanupDemoBaseline(prisma);
  await prisma.$disconnect();
}
