# Asiamath Demo Manual Test Checkpoints d0

## Purpose

Provide a lightweight execution view for `demo/d0` by grouping current demo work into a small number of manual-test checkpoints.

This file does not replace:

- `asiamath-demo-feature-list-d0.json`
- `asiamath-demo-coverage-matrix-d0.md`
- `asiamath-demo-data-source-matrix-d0.md`

It only answers one operational question:

> When should the next worthwhile round of manual testing happen?

## Checkpoints

| Checkpoint | Goal | Included features now | Manual-test focus |
|---|---|---|---|
| `CP1 d0-story core` | Confirm the demo entry and applicant-facing must-pass path are stable enough to build on. | `DEMO-FOUNDATION-002`, `DEMO-ENTRY-001`, `DEMO-STORY-001`, `DEMO-STORY-002`, `DEMO-MODULE-001`, `DEMO-MODULE-002`, `DEMO-MODULE-003`, `DEMO-MODULE-004`, `DEMO-MODULE-007` | Root entry redirects correctly, core routes open, provider switching does not break runtime demo mode, applicant detail/result surfaces are coherent, no dead-end CTA on the must-pass path. |
| `CP2 first hybrid breadth` | Validate the first batch of hybrid breadth pages that should feel like product surfaces rather than placeholders. | `DEMO-MODULE-008`, `DEMO-MODULE-006`, `DEMO-MODULE-013` | `M8`, `M6`, and `M14` open cleanly from real routes, fake-provider data looks credible, pages feel distinct from conference/grant flows, teaser CTAs point to valid destinations. |
| `CP3 static breadth coverage` | Confirm all remaining preview modules add coverage without looking like broken shells. | `DEMO-MODULE-005`, `DEMO-MODULE-009`, `DEMO-MODULE-010`, `DEMO-MODULE-011`, `DEMO-MODULE-012` | Every preview page has context, entry, and return path; no page feels like a dead end; static preview copy still matches shared route and module semantics. |
| `CP4 rehearsal cut` | Run the end-to-end demo as it will actually be presented. | `DEMO-POLISH-001`, `DEMO-POLISH-002` plus all features needed for `d0-story` and selected breadth pages | Full click path is stable, page mode and role badges are correct, fake and real surfaces do not clash, presenter-safe data and shortcuts are ready, narrative can be delivered without oral recovery. |

## Current Mapping

### Current completed or usable before the next checkpoint

- `DEMO-FOUNDATION-001`
- `DEMO-FOUNDATION-002`
- `DEMO-FOUNDATION-003`
- `DEMO-ENTRY-001`
- `DEMO-STORY-002`

### Current in-progress checkpoint

- `CP2 first hybrid breadth`

### Current batch inside `CP2`

- `DEMO-MODULE-008` (`M8 Schools and Training`) as the active hybrid-breadth slice
- `DEMO-MODULE-006` (`M6 Prizes and Awards`) next
- `DEMO-MODULE-013` (`M14 Industry and Partners`) after `M8` and `M6`

## Recommended Manual-Test Order

When a checkpoint is reached, use this order:

1. Open the route directly.
2. Navigate to it from the intended entry page.
3. Trigger the main CTA or teaser link.
4. Check page mode, role, and status badges.
5. Check that mock or fake data still looks like one coherent product.

## Non-Goals

- This file is not a sprint board.
- This file does not assign owners.
- This file does not redefine feature priority outside `d0`.
- This file does not replace per-feature automated testing.
