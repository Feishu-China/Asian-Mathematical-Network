# Asiamath Demo Preview Ops d0

## Purpose

Capture the operational rules for the hosted `d0` preview so Railway/Vercel demo maintenance does not require rediscovering the same deployment and reseed behavior.

This file is about:

- hosted preview wiring
- Railway reseed procedure
- hosted smoke-check expectations
- recurring failure modes

This file is not the demo data contract itself. For that, read `asiamath-demo-seed-contract-d0.md`.

## Stable Rules

### `railway run` is local execution, not remote execution

`railway run <command>` runs the command on the local machine and injects Railway environment variables for the linked project/service.

That means:

- it can use Railway-provided env vars
- it does not run inside the deployed backend container
- it cannot reach Railway-only private hosts unless the local machine can also reach them

### Backend service `DATABASE_URL` may be Railway-internal only

For the hosted backend preview, the linked backend service exposes:

- `DATABASE_URL=postgres.railway.internal...`

That host is reachable from Railway's internal network, but not from a local laptop.

If a local reseed command uses that value directly, Prisma will fail with:

- `Can't reach database server at postgres.railway.internal:5432`

### Local hosted reseed must use the Postgres service public URL

The attached `Postgres` service exposes:

- `DATABASE_PUBLIC_URL`

When reseeding the hosted preview from a local machine, use `DATABASE_PUBLIC_URL`, not the backend service's `DATABASE_URL`.

If the public URL does not already include `?schema=public`, append it for Prisma.

### Public opportunity pages only show `published`

The public conference and grant controllers default to `status=published`.

Operational consequence:

- a seeded `closed` conference improves applicant/demo realism
- it will not appear on public `/conferences`
- this is expected, not a deployment bug

### Vercel preview URLs are immutable

After a new push, Vercel creates a new preview deployment URL.

Do not assume an older preview URL updates in place.

If the UI "did not change", first confirm that the opened URL is the newest preview for the branch/commit.

## Current Hosted Shape

The current `d0` hosted preview assumes:

- Railway project: `asiamath-demo-d0-backend-preview`
- linked backend service: `backend`
- attached database service: `Postgres`
- backend public domain: `backend-production-2d8c.up.railway.app`
- Vercel frontend preview project: `asiamath-demo-d0-frontend-preview`

If these names change, update this file before the next demo-prep cycle.

## Standard Railway Checks

Run these first:

```bash
railway status
railway service list
railway variable list --json
railway variable list -s Postgres --json
```

Interpretation:

- `railway status` confirms the linked project, environment, and service
- `railway service list` confirms the backend and attached `Postgres` service both exist
- `railway variable list --json` shows backend-service vars
- `railway variable list -s Postgres --json` is where `DATABASE_PUBLIC_URL` should be read from

## Hosted Reseed Procedure

### Recommended path

1. Confirm the Railway link is pointing at the intended backend preview.
2. Read the `Postgres` service variables.
3. Copy `DATABASE_PUBLIC_URL`.
4. Reseed with the public connection string.

Command pattern:

```bash
DATABASE_URL='<DATABASE_PUBLIC_URL>?schema=public' npm run seed:demo
```

Example shape only:

```bash
DATABASE_URL='postgresql://...@turntable.proxy.rlwy.net:PORT/railway?schema=public' npm run seed:demo
```

Do not commit the value. Read it from Railway each time.

### What not to do by default

Avoid using this from a local machine as the primary reseed path:

```bash
railway run npm run seed:demo
```

Why:

- it injects backend-service `DATABASE_URL`
- that value may point to `postgres.railway.internal`
- local Prisma cannot reach that host

Use it only if Railway changes the service vars or the execution model in a way that makes the injected database host publicly reachable.

## Hosted Smoke Check

After a successful hosted reseed, verify both API and frontend behavior.

### Backend API expectations

Public conferences:

- `GET /api/v1/conferences` should return `3` published items
- expected slugs:
  - `integration-grant-conf-2026`
  - `regional-topology-symposium-2026`
  - `number-theory-collaboration-workshop-2026`

Public grants:

- `GET /api/v1/grants` should return `2` published items
- expected slugs:
  - `integration-grant-2026-travel-support`
  - `number-theory-collaboration-travel-support-2026`

Showcase applicant:

- login as `demo.showcase.applicant@asiamath.org`
- `GET /api/v1/me/applications` should return `4` items
- expected visible outcomes:
  - one `under_review` conference application
  - one released accepted conference result
  - one released rejected conference result
  - one released accepted grant result with `post_visit_report_status = submitted`

Clean applicant:

- login as `demo.applicant@asiamath.org`
- `GET /api/v1/me/applications` should return `0` items

### Frontend preview expectations

Public conferences page:

- `/conferences` should show:
  - `Integration Grant Conference 2026`
  - `Regional Topology Symposium 2026`
  - `Number Theory Collaboration Workshop 2026`

Showcase applicant page:

- login as `demo.showcase.applicant@asiamath.org`
- `/me/applications` should show:
  - `Regional Topology Symposium 2026`
  - `Number Theory Collaboration Workshop 2026`
  - `Applied PDE Exchange 2025`
  - `Number Theory Collaboration Travel Support 2026`

Clean applicant page:

- login as `demo.applicant@asiamath.org`
- `/me/applications` should still be empty

## Common Failure Modes

### "Railway reseed failed with `postgres.railway.internal`"

Meaning:

- local command used an internal-only database host

Fix:

- fetch `DATABASE_PUBLIC_URL` from `railway variable list -s Postgres --json`
- rerun the seed with that value as local `DATABASE_URL`

### "Push happened but the preview page did not change"

Meaning:

- the browser is probably on an older immutable Vercel preview URL

Fix:

- confirm the newest preview for the pushed branch/commit
- re-open that URL instead of reusing an older preview link

### "The closed conference is missing from `/conferences`"

Meaning:

- expected behavior

Fix:

- none, unless product scope changes
- public list endpoints are `published`-only

### "Showcase grant wants a post-visit report CTA"

Meaning:

- the seeded accepted grant no longer has its post-visit report

Fix:

- reseed and verify the showcase grant application still has `post_visit_report_status = submitted`

## Maintenance Rule

Whenever the preview topology changes, update this file in the same branch as the operational change.

That includes:

- Railway project/service renaming
- Vercel project/linking changes
- reseed command changes
- hosted smoke expectations that are no longer true
