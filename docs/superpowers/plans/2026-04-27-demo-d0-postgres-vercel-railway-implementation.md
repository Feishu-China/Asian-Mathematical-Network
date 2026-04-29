# Demo D0 PostgreSQL Split Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the `demo/d0` deployment baseline from SQLite to PostgreSQL across local development, automated tests, and Railway production while keeping the frontend deployable to Vercel against a configurable API origin.

**Architecture:** Keep `demo/d0` as the product baseline, but execute the migration on a child branch. Replace SQLite with one PostgreSQL-backed Prisma path, archive the old SQLite migration history, and centralize hosted API configuration so Vercel frontend builds can talk directly to the Railway backend. Preserve current application behavior by limiting code changes to configuration, migrations, tests, and thin client wiring.

**Tech Stack:** Node.js, Express, Prisma ORM, PostgreSQL, Jest, React, Vite, Vitest, Vercel, Railway, `ts-node`, `dotenv`

---

## File Map

**Create**
- `backend/.env.example`
- `frontend/.env.example`
- `frontend/src/api/client.ts`
- `frontend/src/api/client.test.ts`
- `frontend/vercel.config.test.ts`
- `frontend/vercel.json`
- `backend/prisma/migrations_sqlite_archive/2026-04-27-sqlite-history/` (shell move target)
- fresh PostgreSQL migration directory under `backend/prisma/migrations/`

**Modify**
- `backend/prisma/schema.prisma`
- `backend/package.json`
- `backend/package-lock.json`
- `backend/src/lib/prisma.ts`
- `backend/tests/databaseConfig.test.ts`
- `backend/tests/review.test.ts`
- `scripts/seed-demo-baseline.mjs`
- `scripts/grant-real-flow-check.mjs`
- `scripts/me-applications-real-flow-check.mjs`
- `frontend/src/api/auth.ts`
- `frontend/src/api/conference.ts`
- `frontend/src/api/grant.ts`
- `frontend/src/api/me.ts`
- `frontend/src/api/profile.ts`
- `frontend/src/api/review.ts`
- `PROGRESS.md`

**Local-only, untracked working files**
- `backend/.env`

## Task 0: Prepare The Branch And Local PostgreSQL Databases

**Files:**
- Create: `backend/.env` (local only, do not commit)

- [ ] **Step 1: Create the dedicated deployment branch**

Run:

```bash
git checkout demo/d0
git pull --ff-only
git checkout -b codex/demo-d0-postgres-deploy
```

Expected: branch switches to `codex/demo-d0-postgres-deploy` with a clean working tree.

- [ ] **Step 2: Create the local PostgreSQL development and test databases**

Run:

```bash
createdb asiamath_dev 2>/dev/null || true
createdb asiamath_test 2>/dev/null || true
psql -d asiamath_dev -c 'select current_database();'
psql -d asiamath_test -c 'select current_database();'
```

Expected: both commands return the matching database names and no authentication error.

- [ ] **Step 3: Create the untracked backend environment file used during implementation**

Write `backend/.env` with this exact content first:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/asiamath_dev?schema=public"
TEST_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/asiamath_test?schema=public"
JWT_SECRET="dev-only-asiamath-jwt-secret"
```

If local PostgreSQL uses different credentials, edit only the connection values before continuing.

- [ ] **Step 4: Run the current clean-state checks before changing code**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network/frontend && npm run build
cd /Users/brenda/Projects/Asian-Mathematical-Network/backend && npm test -- --runInBand tests/databaseConfig.test.ts
```

Expected: both commands pass on the unmodified branch baseline.

- [ ] **Step 5: Commit nothing**

This task is setup only. Do not create a commit yet.

## Task 1: Lock The PostgreSQL Prisma Contract And Environment Example

**Files:**
- Create: `backend/.env.example`
- Modify: `backend/tests/databaseConfig.test.ts`
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/prisma/migrations/` via shell move and regeneration

- [ ] **Step 1: Replace `backend/tests/databaseConfig.test.ts` with a failing PostgreSQL contract test**

Write this exact file:

```ts
import fs from 'fs';
import path from 'path';

const backendRoot = path.join(__dirname, '..');

const readBackendFile = (...segments: string[]) =>
  fs.readFileSync(path.join(backendRoot, ...segments), 'utf8');

describe('backend database configuration', () => {
  it('loads the Prisma datasource URL from DATABASE_URL', () => {
    const schema = readBackendFile('prisma', 'schema.prisma');

    expect(schema).toContain('url      = env("DATABASE_URL")');
  });

  it('uses PostgreSQL as the Prisma provider', () => {
    const schema = readBackendFile('prisma', 'schema.prisma');

    expect(schema).toContain('provider = "postgresql"');
  });

  it('documents the local and test PostgreSQL environment variables', () => {
    const envExample = readBackendFile('.env.example');

    expect(envExample).toContain('DATABASE_URL=');
    expect(envExample).toContain('TEST_DATABASE_URL=');
    expect(envExample).toContain('JWT_SECRET=');
  });

  it('keeps the active migration chain free of SQLite-only syntax', () => {
    const migrationsRoot = path.join(backendRoot, 'prisma', 'migrations');
    const migrationDirectories = fs
      .readdirSync(migrationsRoot)
      .filter((entry) => fs.statSync(path.join(migrationsRoot, entry)).isDirectory());

    for (const directory of migrationDirectories) {
      const sql = fs.readFileSync(path.join(migrationsRoot, directory, 'migration.sql'), 'utf8');
      expect(sql).not.toContain('PRAGMA');
    }

    const lockFile = readBackendFile('prisma', 'migrations', 'migration_lock.toml');
    expect(lockFile).toContain('provider = "postgresql"');
  });
});
```

- [ ] **Step 2: Run the config test to verify it fails for the expected reasons**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network/backend
set -a && source .env && set +a
npx jest --runInBand tests/databaseConfig.test.ts
```

Expected: FAIL because the Prisma provider is still SQLite, `.env.example` does not exist yet, and the active migration chain still contains SQLite-specific history.

- [ ] **Step 3: Write the minimum PostgreSQL schema and environment documentation**

Create `backend/.env.example` with this exact content:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/asiamath_dev?schema=public"
TEST_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/asiamath_test?schema=public"
JWT_SECRET="asiamath-example-jwt-secret-change-before-production"
```

Change the Prisma datasource block in `backend/prisma/schema.prisma` to this exact code:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Archive the SQLite migration history and generate the PostgreSQL initial migration:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network
mkdir -p backend/prisma/migrations_sqlite_archive
mv backend/prisma/migrations backend/prisma/migrations_sqlite_archive/2026-04-27-sqlite-history
cd backend
set -a && source .env && set +a
npx prisma migrate dev --name init_postgres
```

Expected: Prisma creates a fresh timestamped `backend/prisma/migrations/*_init_postgres/` directory and a new `migration_lock.toml` locked to PostgreSQL.

- [ ] **Step 4: Run the config test to verify it passes**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network/backend
set -a && source .env && set +a
npx jest --runInBand tests/databaseConfig.test.ts
```

Expected: PASS with 4 passing tests.

- [ ] **Step 5: Commit the PostgreSQL Prisma baseline**

Run:

```bash
git add backend/.env.example backend/prisma/schema.prisma backend/prisma/migrations_sqlite_archive backend/prisma/migrations backend/tests/databaseConfig.test.ts
git commit -m "feat: switch prisma schema and migrations to postgresql"
```

## Task 2: Remove SQLite Runtime Assumptions From Backend Startup And Utility Scripts

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/package-lock.json`
- Modify: `backend/src/lib/prisma.ts`
- Modify: `backend/tests/databaseConfig.test.ts`
- Modify: `scripts/seed-demo-baseline.mjs`
- Modify: `scripts/grant-real-flow-check.mjs`
- Modify: `scripts/me-applications-real-flow-check.mjs`

- [ ] **Step 1: Extend `backend/tests/databaseConfig.test.ts` with failing runtime-script checks**

Append these two tests at the bottom of the existing `describe` block:

```ts
  it('uses environment-driven PostgreSQL scripts for backend start, dev, and test', () => {
    const packageJson = JSON.parse(readBackendFile('package.json')) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.start).toContain('prisma migrate deploy');
    expect(packageJson.scripts?.start).not.toContain('file:./');
    expect(packageJson.scripts?.dev).toContain('prisma migrate deploy');
    expect(packageJson.scripts?.dev).not.toContain('file:./');
    expect(packageJson.scripts?.test).toContain('TEST_DATABASE_URL');
    expect(packageJson.scripts?.test).not.toContain('file:./');
  });

  it('does not fall back to SQLite in backend utility scripts', () => {
    const scriptPaths = [
      path.join(backendRoot, '..', 'scripts', 'seed-demo-baseline.mjs'),
      path.join(backendRoot, '..', 'scripts', 'grant-real-flow-check.mjs'),
      path.join(backendRoot, '..', 'scripts', 'me-applications-real-flow-check.mjs'),
    ];

    for (const scriptPath of scriptPaths) {
      const contents = fs.readFileSync(scriptPath, 'utf8');

      expect(contents).not.toContain('file:./dev.db');
      expect(contents).toContain('DATABASE_URL');
    }
  });
```

- [ ] **Step 2: Run the config test to verify it fails**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network/backend
set -a && source .env && set +a
npx jest --runInBand tests/databaseConfig.test.ts
```

Expected: FAIL because `backend/package.json` and the three utility scripts still contain SQLite assumptions.

- [ ] **Step 3: Write the minimum environment-driven runtime changes**

Update `backend/src/lib/prisma.ts` to this exact code:

```ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

Update the relevant parts of `backend/package.json` to this exact code:

```json
{
  "scripts": {
    "start": "prisma migrate deploy && ts-node src/index.ts",
    "dev": "prisma migrate deploy && nodemon src/index.ts",
    "test": "sh -c 'DATABASE_URL=\"$TEST_DATABASE_URL\" prisma migrate reset --force --skip-seed && DATABASE_URL=\"$TEST_DATABASE_URL\" jest --runInBand'"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.6",
    "dotenv": "^16.4.7",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3"
  }
}
```

After editing `backend/package.json`, update the lockfile:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network/backend
npm install
```

In `scripts/seed-demo-baseline.mjs`, replace the SQLite fallback block with:

```js
process.env.TS_NODE_PROJECT = path.join(backendDir, 'tsconfig.json');
process.chdir(backendDir);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set before running seed-demo-baseline.mjs');
}
```

In `scripts/grant-real-flow-check.mjs`, replace the SQLite fallback block with:

```js
process.env.TS_NODE_PROJECT = path.join(backendDir, 'tsconfig.json');
process.chdir(backendDir);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set before running grant-real-flow-check.mjs');
}
```

In `scripts/me-applications-real-flow-check.mjs`, replace the SQLite fallback block with:

```js
process.env.TS_NODE_PROJECT = path.join(backendDir, 'tsconfig.json');
process.chdir(backendDir);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set before running me-applications-real-flow-check.mjs');
}
```

- [ ] **Step 4: Run the config test to verify it passes**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network/backend
set -a && source .env && set +a
npx jest --runInBand tests/databaseConfig.test.ts
```

Expected: PASS with 6 passing tests.

- [ ] **Step 5: Commit the backend runtime cleanup**

Run:

```bash
git add backend/package.json backend/package-lock.json backend/src/lib/prisma.ts backend/tests/databaseConfig.test.ts scripts/seed-demo-baseline.mjs scripts/grant-real-flow-check.mjs scripts/me-applications-real-flow-check.mjs
git commit -m "feat: make backend runtime and scripts postgres-driven"
```

## Task 3: Make Backend Test Setup Postgres-Safe And Prove The Backend Test Suite Runs On PostgreSQL

**Files:**
- Modify: `backend/tests/review.test.ts`

- [ ] **Step 1: Run the focused review test against PostgreSQL and verify the failure**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network/backend
set -a && source .env && set +a
DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate reset --force --skip-seed
DATABASE_URL="$TEST_DATABASE_URL" npx jest --runInBand tests/review.test.ts
```

Expected: FAIL inside `promoteReviewer()` because the raw SQL `VALUES (?, ? ...)` setup is SQLite-oriented and should not be preserved in the PostgreSQL branch.

- [ ] **Step 2: Replace the reviewer-role setup with Prisma code**

Change `promoteReviewer` in `backend/tests/review.test.ts` to this exact code:

```ts
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
```

Do not change the rest of the review workflow assertions in this task.

- [ ] **Step 3: Re-run the focused review test and verify it passes**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network/backend
set -a && source .env && set +a
DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate reset --force --skip-seed
DATABASE_URL="$TEST_DATABASE_URL" npx jest --runInBand tests/review.test.ts
```

Expected: PASS for `tests/review.test.ts`.

- [ ] **Step 4: Run the full backend test suite on PostgreSQL**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network/backend
set -a && source .env && set +a
npm test
```

Expected: PASS with the backend suite running entirely against PostgreSQL through `TEST_DATABASE_URL`.

- [ ] **Step 5: Commit the Postgres-safe test fix**

Run:

```bash
git add backend/tests/review.test.ts
git commit -m "test: remove sqlite-specific review test setup"
```

## Task 4: Centralize The Frontend API Base URL

**Files:**
- Create: `frontend/.env.example`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/client.test.ts`
- Modify: `frontend/src/api/auth.ts`
- Modify: `frontend/src/api/conference.ts`
- Modify: `frontend/src/api/grant.ts`
- Modify: `frontend/src/api/me.ts`
- Modify: `frontend/src/api/profile.ts`
- Modify: `frontend/src/api/review.ts`

- [ ] **Step 1: Write the failing frontend API-base tests**

Create `frontend/src/api/client.test.ts` with this exact code:

```ts
import { describe, expect, test } from 'vitest';
import { buildApiBaseUrl } from './client';

describe('buildApiBaseUrl', () => {
  test('falls back to the same-origin API path when no env override is present', () => {
    expect(buildApiBaseUrl({} as ImportMetaEnv)).toBe('/api/v1');
  });

  test('trims a trailing slash from the configured API base URL', () => {
    expect(
      buildApiBaseUrl({
        VITE_API_BASE_URL: 'https://asiamath-api.up.railway.app/api/v1/',
      } as ImportMetaEnv)
    ).toBe('https://asiamath-api.up.railway.app/api/v1');
  });
});
```

- [ ] **Step 2: Run the frontend test to verify it fails**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network/frontend
npm run test:run -- src/api/client.test.ts
```

Expected: FAIL because `frontend/src/api/client.ts` does not exist yet.

- [ ] **Step 3: Implement the shared API client and switch every API module to it**

Create `frontend/.env.example` with this exact content:

```dotenv
VITE_API_BASE_URL="http://127.0.0.1:3000/api/v1"
```

Create `frontend/src/api/client.ts` with this exact code:

```ts
import axios from 'axios';

export const buildApiBaseUrl = (env: ImportMetaEnv) => {
  const configured = env.VITE_API_BASE_URL?.trim();

  if (!configured) {
    return '/api/v1';
  }

  return configured.endsWith('/') ? configured.slice(0, -1) : configured;
};

export const api = axios.create({
  baseURL: buildApiBaseUrl(import.meta.env),
});
```

Update `frontend/src/api/auth.ts` to this exact code:

```ts
import { api } from './client';

export const login = async (data: any) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const register = async (data: any) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const getMe = async (token: string) => {
  const response = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
```

Update `frontend/src/api/conference.ts` to this exact code:

```ts
import { api } from './client';

const withAuth = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const fetchConferenceList = async () => {
  const response = await api.get('/conferences');
  return response.data;
};

export const fetchConferenceDetail = async (slug: string) => {
  const response = await api.get(`/conferences/${slug}`);
  return response.data;
};

export const fetchConferenceApplicationForm = async (conferenceId: string) => {
  const response = await api.get(`/conferences/${conferenceId}/application-form`);
  return response.data;
};

export const fetchMyConferenceApplication = async (token: string, conferenceId: string) => {
  const response = await api.get(`/conferences/${conferenceId}/applications/me`, withAuth(token));
  return response.data;
};

export const createOrganizerConferenceRequest = async (token: string, payload: unknown) => {
  const response = await api.post('/organizer/conferences', payload, withAuth(token));
  return response.data;
};

export const fetchOrganizerConference = async (token: string, conferenceId: string) => {
  const response = await api.get(`/organizer/conferences/${conferenceId}`, withAuth(token));
  return response.data;
};

export const updateOrganizerConferenceRequest = async (
  token: string,
  conferenceId: string,
  payload: unknown
) => {
  const response = await api.put(`/organizer/conferences/${conferenceId}`, payload, withAuth(token));
  return response.data;
};

export const publishOrganizerConferenceRequest = async (token: string, conferenceId: string) => {
  const response = await api.post(
    `/organizer/conferences/${conferenceId}/publish`,
    {},
    withAuth(token)
  );
  return response.data;
};

export const closeOrganizerConferenceRequest = async (token: string, conferenceId: string) => {
  const response = await api.post(
    `/organizer/conferences/${conferenceId}/close`,
    {},
    withAuth(token)
  );
  return response.data;
};

export const createConferenceApplicationRequest = async (
  token: string,
  conferenceId: string,
  payload: unknown
) => {
  const response = await api.post(`/conferences/${conferenceId}/applications`, payload, withAuth(token));
  return response.data;
};

export const updateMyConferenceApplicationDraftRequest = async (
  token: string,
  applicationId: string,
  payload: unknown
) => {
  const response = await api.put(`/me/applications/${applicationId}/draft`, payload, withAuth(token));
  return response.data;
};

export const submitMyConferenceApplicationRequest = async (token: string, applicationId: string) => {
  const response = await api.post(`/me/applications/${applicationId}/submit`, {}, withAuth(token));
  return response.data;
};
```

Update `frontend/src/api/grant.ts` to this exact code:

```ts
import { api } from './client';

const withAuth = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const fetchGrantList = async () => {
  const response = await api.get('/grants');
  return response.data;
};

export const fetchGrantDetail = async (slug: string) => {
  const response = await api.get(`/grants/${slug}`);
  return response.data;
};

export const fetchGrantApplicationForm = async (grantId: string) => {
  const response = await api.get(`/grants/${grantId}/application-form`);
  return response.data;
};

export const fetchMyGrantApplication = async (token: string, grantId: string) => {
  const response = await api.get(`/grants/${grantId}/applications/me`, withAuth(token));
  return response.data;
};

export const createGrantApplicationRequest = async (
  token: string,
  grantId: string,
  payload: unknown
) => {
  const response = await api.post(`/grants/${grantId}/applications`, payload, withAuth(token));
  return response.data;
};

export const updateMyGrantApplicationDraftRequest = async (
  token: string,
  applicationId: string,
  payload: unknown
) => {
  const response = await api.put(`/me/applications/${applicationId}/draft`, payload, withAuth(token));
  return response.data;
};

export const submitMyGrantApplicationRequest = async (token: string, applicationId: string) => {
  const response = await api.post(`/me/applications/${applicationId}/submit`, {}, withAuth(token));
  return response.data;
};
```

Update `frontend/src/api/me.ts` to this exact code:

```ts
import { api } from './client';

const withAuth = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const fetchMyApplications = async (token: string) => {
  const response = await api.get('/me/applications', withAuth(token));
  return response.data;
};
```

Update `frontend/src/api/profile.ts` to this exact code:

```ts
import { api } from './client';

const withAuth = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const fetchMyProfile = async (token: string) => {
  const response = await api.get('/profile/me', withAuth(token));
  return response.data;
};

export const updateMyProfileRequest = async (token: string, payload: unknown) => {
  const response = await api.put('/profile/me', payload, withAuth(token));
  return response.data;
};

export const fetchScholarProfile = async (slug: string) => {
  const response = await api.get(`/scholars/${slug}`);
  return response.data;
};
```

Update `frontend/src/api/review.ts` to this exact code:

```ts
import { api } from './client';

const withAuth = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const fetchOrganizerConferenceApplications = async (token: string, conferenceId: string) => {
  const response = await api.get(`/organizer/conferences/${conferenceId}/applications`, withAuth(token));
  return response.data;
};

export const fetchOrganizerApplicationDetail = async (token: string, applicationId: string) => {
  const response = await api.get(`/organizer/applications/${applicationId}`, withAuth(token));
  return response.data;
};

export const fetchReviewerCandidates = async (token: string, applicationId: string) => {
  const response = await api.get(
    `/organizer/applications/${applicationId}/reviewer-candidates`,
    withAuth(token)
  );
  return response.data;
};

export const assignReviewerRequest = async (token: string, applicationId: string, payload: unknown) => {
  const response = await api.post(
    `/organizer/applications/${applicationId}/assign-reviewer`,
    payload,
    withAuth(token)
  );
  return response.data;
};

export const upsertDecisionRequest = async (token: string, applicationId: string, payload: unknown) => {
  const response = await api.post(
    `/organizer/applications/${applicationId}/decision`,
    payload,
    withAuth(token)
  );
  return response.data;
};

export const releaseDecisionRequest = async (token: string, applicationId: string) => {
  const response = await api.post(
    `/organizer/applications/${applicationId}/release-decision`,
    {},
    withAuth(token)
  );
  return response.data;
};

export const fetchReviewerAssignments = async (token: string) => {
  const response = await api.get('/reviewer/assignments', withAuth(token));
  return response.data;
};

export const fetchReviewerAssignmentDetail = async (token: string, assignmentId: string) => {
  const response = await api.get(`/reviewer/assignments/${assignmentId}`, withAuth(token));
  return response.data;
};

export const submitReviewerReviewRequest = async (
  token: string,
  assignmentId: string,
  payload: unknown
) => {
  const response = await api.post(
    `/reviewer/assignments/${assignmentId}/review`,
    payload,
    withAuth(token)
  );
  return response.data;
};

export const fetchMyApplicationDetail = async (token: string, applicationId: string) => {
  const response = await api.get(`/me/applications/${applicationId}`, withAuth(token));
  return response.data;
};
```

- [ ] **Step 4: Run the frontend API-base test and build**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network/frontend
npm run test:run -- src/api/client.test.ts
npm run build
```

Expected: both commands PASS.

- [ ] **Step 5: Commit the frontend API configuration change**

Run:

```bash
git add frontend/.env.example frontend/src/api/client.ts frontend/src/api/client.test.ts frontend/src/api/auth.ts frontend/src/api/conference.ts frontend/src/api/grant.ts frontend/src/api/me.ts frontend/src/api/profile.ts frontend/src/api/review.ts
git commit -m "feat: centralize frontend api base url"
```

## Task 5: Add Vercel SPA Configuration

**Files:**
- Create: `frontend/vercel.config.test.ts`
- Create: `frontend/vercel.json`

- [ ] **Step 1: Create the failing Vercel config test**

Create `frontend/vercel.config.test.ts` with this exact code:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

describe('frontend vercel config', () => {
  test('rewrites browser routes to index.html for the Vite SPA', () => {
    const config = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'));

    expect(config).toEqual({
      rewrites: [{ source: '/(.*)', destination: '/index.html' }],
    });
  });
});
```

- [ ] **Step 2: Run the Vercel config test to verify it fails**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network/frontend
npm run test:run -- vercel.config.test.ts
```

Expected: FAIL because `frontend/vercel.json` does not exist yet.

- [ ] **Step 3: Create the minimal Vercel SPA rewrite file**

Create `frontend/vercel.json` with this exact content:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 4: Run the config test and frontend build**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network/frontend
npm run test:run -- vercel.config.test.ts src/api/client.test.ts
npm run build
```

Expected: both commands PASS.

- [ ] **Step 5: Commit the Vercel config**

Run:

```bash
git add frontend/vercel.config.test.ts frontend/vercel.json
git commit -m "feat: add vercel spa deployment config"
```

## Task 6: Validate The Real PostgreSQL Demo Path Locally

**Files:**
- Modify: none

- [ ] **Step 1: Seed the PostgreSQL development database**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network/backend
set -a && source .env && set +a
DATABASE_URL="$DATABASE_URL" node ../scripts/seed-demo-baseline.mjs
```

Expected: script prints `Demo baseline ready` and a JSON summary, with no SQLite-related error.

- [ ] **Step 2: Start the backend against PostgreSQL**

Run in a dedicated terminal:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network/backend
set -a && source .env && set +a
npm run dev
```

Expected: Prisma applies migrations if needed and the backend starts on port `3000`.

- [ ] **Step 3: Start the frontend locally**

Run in a second dedicated terminal:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network/frontend
npm run dev
```

Expected: Vite starts and serves the frontend on its default local port with the existing `/api/v1` proxy.

- [ ] **Step 4: Run the real applicant-flow integration checks**

Run in a third terminal after both servers are up:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network
PORTAL_INT_BACKEND_ORIGIN="http://127.0.0.1:3000" PORTAL_INT_FRONTEND_ORIGIN="http://127.0.0.1:5173" DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/asiamath_dev?schema=public" npm run test:portal:int
GRANT_INT_BACKEND_ORIGIN="http://127.0.0.1:3000" GRANT_INT_FRONTEND_ORIGIN="http://127.0.0.1:5173" DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/asiamath_dev?schema=public" npm run test:grant:int
```

Expected: both integration scripts PASS, proving the PRD requirement for a thin-but-real internal deployment path still holds on PostgreSQL.

- [ ] **Step 5: Commit nothing**

This task is verification only. Do not create a commit here.

## Task 7: Deploy The Branch Preview And Record The Handoff

**Files:**
- Modify: `PROGRESS.md`

- [ ] **Step 1: Push the working branch**

Run:

```bash
git push -u origin codex/demo-d0-postgres-deploy
```

Expected: the branch exists on the remote and is ready for Vercel/Railway preview deployment.

- [ ] **Step 2: Configure the Railway backend preview**

In Railway, create or update the backend service for branch preview with these settings:

- root directory: `backend`
- start command: `npm run start`
- `DATABASE_URL`: Railway PostgreSQL connection string
- `JWT_SECRET`: a long random value

Expected: Railway backend boots, runs `prisma migrate deploy`, and exposes the API without a SQLite error.

- [ ] **Step 3: Configure the Vercel frontend preview**

In Vercel, set these project settings:

- root directory: `frontend`
- build command: `npm run build`
- output directory: `dist`
- `VITE_API_BASE_URL`: the exact public Railway backend origin with an `/api/v1` suffix

Expected: the preview build succeeds and the deployed frontend resolves deep links through `frontend/vercel.json`.

- [ ] **Step 4: Perform the hosted smoke check**

Manually verify these routes on the preview deployment:

- `/portal`
- `/login`
- `/register`
- `/dashboard`
- `/me/applications`
- one `/conferences/:slug` detail page
- one `/grants/:slug` detail page

Expected: login/register use the real backend, authenticated applicant pages load against PostgreSQL, and public routes still resolve on direct refresh.

- [ ] **Step 5: Append the handoff log to `PROGRESS.md` and commit**

Append this exact entry near the top of `PROGRESS.md`:

```md
### 2026-04-27 (PostgreSQL deployment slice)
*   **Agent 角色**: Coding Agent (Deployment and database migration)
*   **完成 Slice**: `demo/d0` PostgreSQL baseline + Vercel/Railway split deployment preview
*   **变更记录**:
    *   Prisma datasource 改为 PostgreSQL，并重建 active migration 历史。
    *   backend `start` / `dev` / `test` 改为环境变量驱动，不再依赖 SQLite 文件库。
    *   seed / integration 脚本移除 SQLite fallback，改为显式要求 `DATABASE_URL`。
    *   frontend API client 改为 `VITE_API_BASE_URL` 可配置，Vercel 增加 SPA rewrite 配置。
*   **验证记录**:
    *   backend Jest suite 通过 PostgreSQL test database 运行。
    *   `npm run test:portal:int` 与 `npm run test:grant:int` 在 PostgreSQL development database 上通过。
    *   Railway backend preview 可启动并执行 `prisma migrate deploy`。
    *   Vercel frontend preview 可通过配置的 Railway API origin 访问真实后端。
*   **边界与说明**:
    *   本轮未迁移旧 SQLite 数据。
    *   backend 生产运行时暂时保留 `ts-node`，后续再切换到 `tsc + node dist`。
```

Then run:

```bash
git add PROGRESS.md
git commit -m "docs: log postgres split deployment handoff"
git push
```

Expected: the branch contains the verified handoff artifact required by `AGENT_HARNESS.md`.
