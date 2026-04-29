# Demo D0 PostgreSQL And Split Deployment Design

Date: 2026-04-27
Status: Draft for review
Type: Deployment and database architecture change for `demo/d0`

References:
- `backend/prisma/schema.prisma`
- `backend/package.json`
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
- `frontend/vite.config.ts`

## 1. Purpose

This design defines the first implementation slice for making `demo/d0` deployable as a split application:

- frontend on Vercel
- backend on Railway
- Prisma backed by PostgreSQL in all environments

The goal of this slice is not to complete all long-term deployment hardening. The goal is to remove SQLite as an active runtime dependency, establish one PostgreSQL-based Prisma path for development, test, and production, and create the minimum deployment shape needed to validate that the current `demo/d0` product can run in hosted environments.

## 2. Current Problem

The current repository is blocked from that deployment shape for four separate reasons:

1. Prisma is still configured for SQLite in `backend/prisma/schema.prisma`.
2. Backend scripts in `backend/package.json` force `DATABASE_URL=file:./dev.db` or `file:./test.db`, so the runtime cannot naturally switch to PostgreSQL.
3. Seed and integration scripts still assume local SQLite file databases.
4. Frontend API clients hardcode `/api/v1`, which works with local Vite proxying but does not yet provide a clean hosted API configuration for Vercel -> Railway traffic.

The backend logic itself is mostly Prisma CRUD and transaction code, so the engineering challenge is primarily infrastructure and workflow cleanup rather than a broad application rewrite.

## 3. Core Decision

The preferred approach is:

1. Use PostgreSQL everywhere Prisma runs.
2. Keep `demo/d0` as the functional baseline.
3. Perform deployment and database work on a child branch cut from `demo/d0`, not on `main` and not directly on `demo/d0`.
4. Treat this as a minimum deployable architecture slice, not a full production hardening pass.

This is preferred over:

- keeping SQLite locally while only production uses PostgreSQL
- trying to deploy the current Express + SQLite shape directly to Vercel
- re-basing the deployment work on `main` instead of the demo branch that contains the relevant product state

## 4. Environment Model

All Prisma-backed environments should use PostgreSQL:

### 4.1 Local development

- local PostgreSQL database
- used by backend `dev`
- used by seed and manual integration scripts

### 4.2 Automated tests

- separate PostgreSQL test database
- used by Jest and `prisma migrate reset`
- isolated from the local development database

### 4.3 Production / hosted preview

- Railway PostgreSQL
- used by the Railway-hosted backend service
- frontend deployed separately to Vercel

This design intentionally removes SQLite from all standard development, test, and deployment paths.

## 5. Branch Strategy

The repository should use this branch model for the migration work:

1. Continue feature stabilization on `demo/d0`.
2. When ready, create a child branch such as `codex/demo-d0-postgres-deploy` from `demo/d0`.
3. Apply all PostgreSQL and deployment work on that child branch.
4. Use hosted preview deployments to validate the branch before deciding whether to merge back into `demo/d0`.

This keeps the demo feature branch stable while still using its current product state as the deployment baseline.

## 6. Scope

### 6.1 In scope for the first batch

- switch Prisma provider from SQLite to PostgreSQL
- remove SQLite-specific runtime assumptions from backend scripts
- remove SQLite fallback logic from seed and integration scripts
- rebuild migration history for PostgreSQL
- make backend tests use PostgreSQL
- replace or remove the small number of SQLite-sensitive raw SQL patterns in tests
- add a configurable frontend API base URL
- add minimum Vercel SPA routing support
- keep Railway backend startup simple enough to validate deployment quickly

### 6.2 Out of scope for the first batch

- migrating existing SQLite data into PostgreSQL
- CI pipeline redesign
- production-grade CORS tightening
- moving backend runtime from `ts-node` to compiled `dist` output
- frontend feature redesign
- controller or route rewrites unrelated to PostgreSQL compatibility

## 7. Backend Configuration Strategy

### 7.1 Prisma datasource

`backend/prisma/schema.prisma` should use:

- `provider = "postgresql"`
- `url = env("DATABASE_URL")`

The backend should stop supporting an active SQLite provider path in committed runtime code.

### 7.2 Script behavior

`backend/package.json` should be rewritten so:

- `dev` reads `DATABASE_URL`, applies migrations, then starts the backend
- `start` reads `DATABASE_URL`, applies migrations, then starts the backend
- `test` sets `DATABASE_URL` from `TEST_DATABASE_URL`, resets the test database, then runs Jest

No production or development script should force a `file:./*.db` value.

### 7.3 Environment variables

The first batch should standardize the following variables:

- `DATABASE_URL`
- `TEST_DATABASE_URL`
- `JWT_SECRET`

A checked-in example environment file should document these values without storing secrets.

## 8. Frontend Configuration Strategy

The frontend should gain a single configurable API base contract:

- `VITE_API_BASE_URL`

Rules:

1. Local development may continue to use `/api/v1` so the existing Vite proxy remains useful.
2. Hosted Vercel environments should explicitly point `VITE_API_BASE_URL` at the deployed Railway backend origin with an `/api/v1` suffix.
3. API helper files under `frontend/src/api/` should use the shared configurable base instead of each hardcoding `/api/v1`.

This keeps the frontend deployment simple and avoids coupling the first batch to Vercel rewrite-based API proxying.

## 9. Backend Runtime Strategy

For the first batch, the backend should keep the current TypeScript runtime style:

- Prisma migration at startup
- `ts-node`-based execution for the backend service

This is not the preferred long-term production form, but it is the smallest change set that allows the team to validate the split deployment architecture without simultaneously introducing:

- database migration changes
- deployment changes
- compiled runtime packaging changes

The follow-up slice should move the backend toward:

- `tsc` build output
- `node dist/...` startup
- a production-only build configuration that excludes tests

## 10. Migration History Strategy

The current migration history should be treated as SQLite-specific history, not PostgreSQL history.

Evidence in the repository:

- `backend/prisma/migrations/migration_lock.toml` is locked to SQLite
- existing migration SQL includes SQLite-specific syntax such as `PRAGMA`

Therefore, the first batch should:

1. preserve the current migration directory as archived SQLite history
2. stop using it as the active migration chain
3. generate a fresh PostgreSQL initial migration from the current final Prisma schema
4. use that new PostgreSQL migration chain for local development, tests, and Railway deployment

This is cleaner and lower-risk than attempting to continue a mixed-provider migration history.

## 11. Data Strategy

The first batch should not migrate existing SQLite data automatically.

Instead:

- new PostgreSQL databases should be created from the new migration history
- demo data should be repopulated through seed and baseline scripts
- deployment validation should use seeded PostgreSQL data, not imported SQLite data

If SQLite preservation is later required, that should be a dedicated second slice with an explicit one-time data migration plan.

## 12. File-Level Change Boundary

### 12.1 Expected to change

- `backend/prisma/schema.prisma`
- `backend/package.json`
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
- `frontend/vercel.json` or equivalent frontend-only Vercel config
- active Prisma migration directory contents

### 12.2 Expected not to change in the first batch

- most `backend/src/controllers/*`
- most `backend/src/routes/*`
- frontend page components
- application workflow behavior unrelated to database provider assumptions

## 13. Testing And Validation Requirements

This slice is only complete when the following are verified:

1. frontend production build still passes
2. backend tests run against PostgreSQL rather than SQLite
3. seed and integration scripts can initialize PostgreSQL-backed demo data
4. local frontend + local backend still work together
5. a Railway backend can boot with PostgreSQL and apply migrations
6. a Vercel frontend can call the Railway backend through the configured API base URL

The minimum success condition is not theoretical compatibility. It is a working branch-level deployment validation path.

## 14. Risks And Follow-Up

### 14.1 Accepted first-batch risks

- backend production still uses `ts-node`
- CORS remains permissive
- old SQLite data is not carried forward automatically

These are acceptable because they reduce concurrent moving parts during the first deployment-validation slice.

### 14.2 Required follow-up after a successful first batch

- switch backend runtime to built JavaScript output
- tighten production CORS configuration
- formalize deployment docs and env setup
- decide whether existing SQLite demo data needs one-time migration into PostgreSQL

## 15. Recommendation

Proceed with a PostgreSQL-only first batch on a child branch from `demo/d0`, with these priorities:

1. unify Prisma on PostgreSQL
2. remove SQLite runtime assumptions
3. restore green local and test workflows on PostgreSQL
4. validate Vercel frontend + Railway backend deployment with seeded PostgreSQL data

This provides the fastest path to a defensible answer about whether `demo/d0` can be deployed in the intended architecture without over-expanding the scope of the first implementation slice.
