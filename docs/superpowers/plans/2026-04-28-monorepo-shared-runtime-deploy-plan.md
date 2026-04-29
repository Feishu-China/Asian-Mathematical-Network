# Monorepo Shared Package + Backend Runtime + Hosted Deployment Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move shared types into a real npm workspace package, switch the backend production/runtime path to compiled `dist` output, and align Vercel/Railway preview deployment with a monorepo-aware source layout.

**Architecture:** Keep the repository as a single npm-workspaces monorepo with `frontend`, `backend`, and `packages/shared`. Frontend and backend import `@asiamath/shared` explicitly, backend compiles only its runtime source into `dist`, and hosted deploy settings point at the full repository while selecting app-specific roots/commands.

**Tech Stack:** npm workspaces, TypeScript, Express, Prisma, Jest, React, Vite, Vercel, Railway

---

### Task 1: Lock the workspace and runtime expectations with tests
- [ ] Add a root config test that fails until npm workspaces and the shared package are declared explicitly.
- [ ] Extend backend config tests so they fail until `build` exists and `start` runs compiled `dist` output rather than `ts-node`.

### Task 2: Create `@asiamath/shared` and rewire imports
- [ ] Create `packages/shared/package.json` and `packages/shared/src/models.ts`.
- [ ] Update frontend/backend imports and package dependencies to use `@asiamath/shared/models`.
- [ ] Refresh root workspace metadata and lockfiles so npm resolves the shared package as a first-class workspace dependency.

### Task 3: Compile backend for production runtime
- [ ] Add backend build scripts and build-specific TypeScript config that emits `dist` from `backend/src`.
- [ ] Keep local dev/test flows intact while making production `start` use `prisma migrate deploy && node dist/index.js`.
- [ ] Update runtime-affecting scripts/tests that currently assume `ts-node`-only backend execution.

### Task 4: Make deploy config monorepo-aware
- [ ] Add repo-local deploy config that makes Railway build/start from the monorepo root while targeting the backend service entrypoints.
- [ ] Ensure Vercel configuration remains SPA-safe while the project is ready for root-repo Git connection and `frontend` root builds.
- [ ] Apply the corresponding hosted project/service settings through CLI/API where possible.

### Task 5: Verify end to end
- [ ] Run focused config tests first.
- [ ] Run backend/frontend builds against the workspace layout.
- [ ] Re-run the real PostgreSQL integration checks.
- [ ] Re-deploy/update hosted previews and confirm the live frontend/backend still answer through the monorepo-aware setup.
