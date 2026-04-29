# Asiamath Documentation Guide

This directory contains the current product, specification, planning, and reference documents for the Asiamath MVP and demo workstreams.

The main goal of this README is to answer four questions quickly:
- what each document is for
- which document is the current source of truth
- what to read first for MVP work vs demo work
- how to resolve conflicts between documents

## Directory Structure

- `product/`
  Product-level documents. Includes the full-platform vision, current MVP scope, and current demo scope.
- `specs/`
  Implementation-facing specifications. Includes design, technical, API, and database semantics.
- `planning/`
  Execution planning artifacts. The current feature backlog lives here.
- `reference/`
  External or stakeholder-provided baseline materials.
- `archive/`
  Superseded or historical documents. These are not current source-of-truth documents.

## Current Document Roles

### Product

- `docs/product/asiamath-prd-simplified.md`
  Full-platform product vision. Use this for long-range scope, module intent, and future-state thinking.
- `docs/product/asiamath-mvp-prd-v3.2.md`
  Current MVP scope. Use this to decide what the team is actually building now.
- `docs/product/asiamath-demo-prd-v3.1.md`
  Current demo scope and narrative. Use this to decide what the static/clickable demo must show.

### Specs

- `docs/specs/asiamath-design-spec-v2.1.md`
  Shared information architecture, route map, page skeletons, page modes, and state presentation.
- `docs/specs/asiamath-technical-spec-v2.1.md`
  Technical boundaries, implementation layering, and reusable architecture decisions.
- `docs/specs/asiamath-api-spec-v2.1.md`
  Canonical frontend-backend contract for the current phase.
- `docs/specs/asiamath-database-schema-v1.1.md`
  Conceptual data model and persistence semantics.
- `database/ddl/asiamath-database-ddl-v1.1.sql`
  Current physical PostgreSQL DDL aligned with the schema document.

### Planning

- `docs/planning/asiamath-feature-list-v2.2.json`
  Current execution backlog and feature-level delivery plan.
- `docs/planning/asiamath-demo-preview-ops-d0.md`
  Hosted demo preview runbook. Use this for Railway/Vercel preview checks, hosted reseeding, and recurring deployment pitfalls.
- `docs/planning/asiamath-demo-seed-contract-d0.md`
  Real demo seed contract. Use this to understand which demo accounts, opportunities, and workflow states are intentionally seeded.

### Reference

- `docs/reference/asiamath_system_map.html`
  Stakeholder-provided module baseline. Use it as an alignment reference, not as the direct implementation contract.

## Source-of-Truth Priority

When documents overlap, use this precedence order:

1. Current implementation contract
   `API spec`, `database schema`, and `DDL` define the current contract and persistence semantics.
2. Current product scope
   `MVP PRD` and `Demo PRD` define what is in scope now.
3. Shared product structure
   `Design spec` and `Technical spec` define the shared page, route, and implementation boundaries.
4. Full-platform vision
   `prd-simplified` provides long-range context, but does not override the current MVP or current specs.
5. External baseline
   `system_map.html` is a reference baseline, not a replacement for active implementation specs.

If a conflict exists between the full-platform vision and the current MVP/spec set, the current MVP/spec set wins.

## What To Read First

### For MVP implementation

Read in this order:

1. `docs/product/asiamath-mvp-prd-v3.2.md`
2. `docs/specs/asiamath-design-spec-v2.1.md`
3. `docs/specs/asiamath-api-spec-v2.1.md`
4. `docs/specs/asiamath-database-schema-v1.1.md`
5. `database/ddl/asiamath-database-ddl-v1.1.sql`
6. `docs/planning/asiamath-feature-list-v2.2.json`

### For demo implementation

Read in this order:

1. `docs/product/asiamath-demo-prd-v3.1.md`
2. `docs/specs/asiamath-design-spec-v2.1.md`
3. `docs/specs/asiamath-api-spec-v2.1.md`
4. `docs/planning/asiamath-demo-seed-contract-d0.md`
5. `docs/planning/asiamath-demo-preview-ops-d0.md`
6. `docs/planning/asiamath-feature-list-v2.2.json`

### For full product context

Read:

1. `docs/product/asiamath-prd-simplified.md`
2. `docs/reference/asiamath_system_map.html`

Then return to the current MVP/demo documents before making implementation decisions.

## Current Canonical Decisions

The current document set assumes the following:

- public scholar route: `/scholars/:slug`
- post-visit report route: `/me/applications/:id/post-visit-report`
- governance preview route: `/admin/governance`
- authenticated global roles: `applicant`, `reviewer`, `organizer`, `admin`
- `Visitor` is an unauthenticated viewer state, not a persisted role
- conference application and grant application are separate records
- `applications.status` is workflow-only
- final outcome lives in `decisions.final_status`
- applicant visibility is gated by `decisions.release_status`
- current MVP grant management reuses `conference_staff`
- `grant_staff` is a future option, not a current MVP table

## Update Rules

When a change affects more than one layer, update documents in this order:

1. MVP PRD or Demo PRD if scope changed
2. Design spec if route/page/state semantics changed
3. API spec if contract changed
4. Database schema and DDL if persistence semantics changed
5. Feature list if delivery breakdown changed

Do not leave the feature list ahead of the specs for long.

## Notes on Older Concepts

- `observer` may still appear in the full-platform PRD or stakeholder reference materials.
  In the current MVP/spec set, it is not a canonical persisted user role.
- `prd-simplified` is intentionally broader than the current build.
  Treat it as future-state context, not as the final arbiter for current implementation conflicts.
