# Asiamath d0 Hosted Smoke Run

> Date: 2026-04-29  
> Scope: `DR-005` hosted preview reseed + smoke  
> Operator: Codex  
> Source-of-truth set:
> - `docs/planning/asiamath-sprint-1-demo-readiness-2026-04-29.md`
> - `docs/planning/asiamath-d0-hosted-smoke-runbook-2026-04-29.md`
> - `docs/planning/asiamath-demo-preview-ops-d0.md`
> - `docs/planning/asiamath-d0-baseline-freeze-2026-04-29.md`
> - `docs/planning/asiamath-demo-seed-contract-d0.md`
> - `docs/planning/asiamath-demo-kit-d0-2026-04-29.md`

## Summary

- Result: `Pass`
- Reseed performed: `Yes`
- Hosted preview branch treated as live: `codex/demo-d0-postgres-deploy`
- Frontend preview URL used:
  - `https://asiamath-demo-d0-frontend-preview-b9dty01s0-feishus-projects.vercel.app`
- Backend base URL used:
  - `https://backend-production-2d8c.up.railway.app`
- Non-blocking caveat:
  - browser automation session cleanup was not fully reliable for anonymous/public chrome checks, so public-page validation relied on page content + network evidence rather than navbar auth state alone

## 1. Live environment confirmation

### 1.1 Railway

Observed from live CLI checks:

- project: `asiamath-demo-d0-backend-preview`
- environment: `production`
- linked service: `backend`
- attached database service: `Postgres`
- backend public URL:
  - `https://backend-production-2d8c.up.railway.app`
- backend service status:
  - `Online`
- latest backend deployment:
  - deployment id: `3c6799ab-68d5-4b53-85a1-9dc241c25b64`
  - created at: `2026-04-29T14:10:31.554+08:00`
  - Railway CLI deployment metadata note:
    - `manual redeploy from codex/demo-d0-postgres-deploy`

Important env observation:

- backend service `DATABASE_URL` still points to `postgres.railway.internal`, so it is not safe for local reseed
- `Postgres` service exposes `DATABASE_PUBLIC_URL`, and that is what was used for the real reseed

### 1.2 Vercel

Observed from live CLI checks:

- linked Vercel project:
  - `asiamath-demo-d0-frontend-preview`
- latest preview deployment URL:
  - `https://asiamath-demo-d0-frontend-preview-b9dty01s0-feishus-projects.vercel.app`
- latest preview deployment state:
  - `READY`
- preview created at:
  - `2026-04-29T15:34:01.459+08:00`
- preview ready at:
  - `2026-04-29T15:34:18.510+08:00`
- source branch:
  - `codex/demo-d0-postgres-deploy`
- source commit:
  - `7443fdeb95c2249ef66f9e3e232d915b3c2528d6`
- source commit message:
  - `docs: add sprint 1 demo execution artifacts`
- branch alias from deployment metadata:
  - `asiamath-demo-d0-frontend-preview-git-c-a855f7-feishus-projects.vercel.app`

Additional observation:

- the same Vercel project also has a `target=production` deployment from `main`, but the latest preview URL used for this smoke run was still on `codex/demo-d0-postgres-deploy`
- this matches the freeze rule that hosted `d0` preview should not be assumed to have cut over to `main`

### 1.3 Preview env wiring

Observed from live CLI + browser network:

- Vercel preview env metadata includes `VITE_API_BASE_URL` for `preview`
- the CLI listing did not expose the encrypted value directly
- browser request logs from the preview showed frontend XHR calls hitting:
  - `https://backend-production-2d8c.up.railway.app/api/v1/...`

Conclusion:

- hosted frontend preview was wired to the expected Railway backend URL during this run

## 2. Railway reseed

### 2.1 Method used

Used the runbook-safe path:

1. confirmed Railway project/service topology
2. read `Postgres.DATABASE_PUBLIC_URL`
3. locally exported `DATABASE_URL=<DATABASE_PUBLIC_URL>?schema=public`
4. ran:
   - `npm run seed:demo`

Not used:

- `railway run npm run seed:demo`
- backend service `DATABASE_URL=postgres.railway.internal...`

### 2.2 Result

Reseed result: `Success`

Evidence from command output:

- `Demo baseline ready`
- counts restored to:
  - `conferences: 4`
  - `publishedConferences: 3`
  - `closedConferences: 1`
  - `grants: 2`
- demo accounts restored:
  - `demo.organizer@asiamath.org`
  - `demo.reviewer@asiamath.org`
  - `demo.applicant@asiamath.org`
  - `demo.showcase.applicant@asiamath.org`

## 3. API smoke

| Check | Result | Observation |
|---|---|---|
| `GET /api/v1/conferences` | Pass | `200`, `meta.total = 3`, slugs: `number-theory-collaboration-workshop-2026`, `integration-grant-conf-2026`, `regional-topology-symposium-2026` |
| `GET /api/v1/grants` | Pass | `200`, `meta.total = 2`, slugs: `number-theory-collaboration-travel-support-2026`, `integration-grant-2026-travel-support` |
| `GET /api/v1/scholars` | Pass | `200`, `meta.total = 3`, slugs: `aisha-rahman`, `farah-iskandar`, `ravi-iyer` |
| `GET /api/v1/scholars/ravi-iyer` | Pass | `200` |
| showcase applicant login | Pass | `200`, token issued for `demo.showcase.applicant@asiamath.org` |
| showcase `GET /api/v1/auth/me` | Pass | `200`, `available_workspaces = ['applicant']` |
| showcase `GET /api/v1/me/applications` | Pass | `200`, `meta.total = 4`; titles matched the 4 expected records |
| showcase accepted grant detail | Pass | `200`, `result = Awarded`, `post_visit_report_status = submitted`, `attendance_confirmed = true`, narrative non-empty |
| clean applicant login | Pass | `200`, token issued for `demo.applicant@asiamath.org` |
| clean `GET /api/v1/me/applications` | Pass | `200`, `meta.total = 0`, `items = []` |

### 3.1 Showcase applicant list details

Observed `viewer_status` / decision spread:

1. `Number Theory Collaboration Travel Support 2026`
   - `viewer_status = result_released`
   - `decision = Awarded`
   - `post_visit_report_status = submitted`
2. `Applied PDE Exchange 2025`
   - `viewer_status = result_released`
   - `decision = Rejected`
3. `Number Theory Collaboration Workshop 2026`
   - `viewer_status = result_released`
   - `decision = Accepted`
4. `Regional Topology Symposium 2026`
   - `viewer_status = under_review`

## 4. Browser smoke

Screenshots captured under:

- [tmp/hosted-smoke/2026-04-29/portal-fresh.png](/Users/brenda/Projects/Asian-Mathematical-Network/tmp/hosted-smoke/2026-04-29/portal-fresh.png)
- [tmp/hosted-smoke/2026-04-29/dashboard-showcase.png](/Users/brenda/Projects/Asian-Mathematical-Network/tmp/hosted-smoke/2026-04-29/dashboard-showcase.png)
- [tmp/hosted-smoke/2026-04-29/me-applications-showcase.png](/Users/brenda/Projects/Asian-Mathematical-Network/tmp/hosted-smoke/2026-04-29/me-applications-showcase.png)
- [tmp/hosted-smoke/2026-04-29/grant-detail-showcase.png](/Users/brenda/Projects/Asian-Mathematical-Network/tmp/hosted-smoke/2026-04-29/grant-detail-showcase.png)
- [tmp/hosted-smoke/2026-04-29/scholars.png](/Users/brenda/Projects/Asian-Mathematical-Network/tmp/hosted-smoke/2026-04-29/scholars.png)
- [tmp/hosted-smoke/2026-04-29/me-applications-clean.png](/Users/brenda/Projects/Asian-Mathematical-Network/tmp/hosted-smoke/2026-04-29/me-applications-clean.png)

| Check | Result | Observation |
|---|---|---|
| `/portal` | Pass | hero loaded; `Featured call`, `Opportunities`, and scholar teaser text present; browser request log showed `/conferences`, `/grants`, `/scholars` hitting Railway backend; no page errors |
| `/dashboard` with showcase applicant | Pass | page loaded at `/dashboard`; `Dashboard`, `Back to portal`, `Account`, and `My Applications` were all visible; no page errors |
| `/me/applications` with showcase applicant | Pass | page loaded; all 4 expected records were visible; no page errors |
| accepted grant detail | Pass | page loaded at `/me/applications/3fed206f-0958-431f-83f6-3cb3b10c61f3`; `Awarded`, `Post-visit report`, `Status: submitted`, `Attendance: Confirmed`, and narrative text were all visible; no page errors |
| `/scholars` | Pass | page loaded; `Scholar directory`, `Research clusters`, `Public scholar profiles`, and `Ravi Iyer` were visible; no page errors |
| clean applicant `/me/applications` | Pass | page loaded without leaked showcase records; `Browse conferences` / `Browse grants` CTA present; empty-state copy was split by section rather than a single generic `No applications yet` string |

### 4.1 Browser-specific observations

- Browser automation session cleanup did not always restore an anonymous navbar state cleanly, even after cookie clearing.
- Because of that, public-page validation was based on:
  - page body content
  - network requests
  - explicit page error checks
  rather than the presence of a `Sign in` button alone.
- Direct open of `/scholars` did not show `Back to portal` in page text. This was not treated as a blocker for this hosted smoke run because:
  - the page itself loaded correctly
  - the required scholar content was present
  - this run did not conclusively re-verify the portal-origin chained return context in browser automation

## 5. Problem triage

### 5.1 Data

- Status: `No blocker`
- Reseed restored the expected opportunity counts and applicant states.

### 5.2 Env

- Status: `No blocker`
- `VITE_API_BASE_URL` exists for preview.
- Runtime network requests hit the expected Railway backend domain.

### 5.3 Branch / deployment source

- Status: `No blocker`
- Latest Vercel preview deployment used in this run was still sourced from `codex/demo-d0-postgres-deploy`.
- Latest Railway backend deployment metadata also pointed to a manual redeploy from `codex/demo-d0-postgres-deploy`.

### 5.4 Browser

- Status: `Non-blocking caveat`
- agent-browser session cleanup is not perfect for anonymous/public chrome assertions.
- This affected confidence in navbar auth-state checks, but did not block any required page from loading or any required demo data from rendering.

## 6. Conclusion

Final result for this run: `Pass`

Reasoning:

1. Railway reseed succeeded with the correct `Postgres.DATABASE_PUBLIC_URL` path.
2. Public conferences / grants / scholars API all matched the current `d0` seed contract.
3. showcase applicant and clean applicant API behavior both matched the expected workflow states.
4. Required browser surfaces all loaded and rendered the expected hosted data:
   - `/portal`
   - `/dashboard`
   - `/me/applications`
   - accepted grant detail
   - `/scholars`
5. No environment drift, branch-source mismatch, or data corruption was found in the live hosted preview used for this run.
