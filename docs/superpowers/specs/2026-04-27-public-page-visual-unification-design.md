# Public Page Visual Unification Addendum

Date: 2026-04-27
Status: Draft for review
Type: Incremental addendum to the approved portal homepage and fidelity specs

References:
- `docs/superpowers/specs/2026-04-26-portal-homepage-m4-design.md`
- `docs/superpowers/specs/2026-04-26-portal-homepage-fidelity-and-return-context-design.md`
- `docs/superpowers/specs/2026-04-27-portal-homepage-ui-priority-design.md`

## 1. Purpose

This addendum defines how the pages beyond `/portal` should align visually with the homepage without turning every public route into a second homepage.

The current public site already has:

- a shared public masthead
- a stronger homepage direction
- stable public browse routes

But the page bodies still split into multiple visual systems. The goal of this addendum is to unify the **public browse surfaces** so the site reads as one product.

## 2. Core Decision

The site should not have one single visual language for every route.

It should have **two intentionally different families**:

1. `Public browse surfaces`
   Public discovery routes and public detail routes that a visitor browses from the homepage.

2. `Workspace / task surfaces`
   Authenticated, form-heavy, or workflow-heavy routes such as applications, dashboard, reviewer flows, and organizer/admin workspaces.

This addendum only applies to the first family.

## 3. In Scope

This slice covers visitor-facing pages rendered through `PortalShell`, especially:

### Priority 1: primary public browse chain

- `/conferences`
- `/conferences/:slug`
- `/grants`
- `/grants/:slug`
- `/schools`
- `/schools/:slug`
- `/scholars`
- `/scholars/:slug`
- `/prizes`
- `/prizes/:slug`

These routes form the main user journey after leaving the homepage. They should be unified first.

### Priority 2: secondary public breadth surfaces

- `/newsletter`
- `/newsletter/:slug`
- `/publications`
- `/publications/:slug`
- `/videos`
- `/videos/:slug`
- `/partners`
- `/outreach`
- `/admin/governance`

These routes should visually belong to the same public site, but they are second-order surfaces and can follow after the primary chain.

## 4. Out of Scope

This addendum does not include:

- `WorkspaceShell` pages
- application flows such as `/conferences/:slug/apply` and `/grants/:slug/apply`
- `/me/*` account and applicant routes
- reviewer, organizer, or admin workflow screens outside the public governance preview page
- full redesign of login/register in the same slice
- homepage IA changes

## 5. Design Principle

The homepage should remain the strongest brand moment.

Secondary public pages should be clearly related to the homepage, but calmer:

- no homepage-scale dark hero on every page
- no attempt to repeat the homepage’s full atmospheric treatment
- no generic app-dashboard feel

The desired relationship is:

- homepage = front door and strongest editorial moment
- public browse pages = calmer but clearly from the same family

## 6. What Must Be Unified

The unification target is the **body style language**, not a cloned page template.

The following should become consistent across public browse pages:

### 6.1 Page header rhythm

Public `PortalShell` pages should share a more intentional header rhythm:

- eyebrow treatment
- title scale
- description width and line length
- spacing between badges, title, description, and return actions

The header should feel editorial and network-facing, not like a utility dashboard.

### 6.2 Grid rhythm

List pages should converge on a shared grid system:

- same card widths or close enough to feel related
- same spacing scale between cards
- same vertical section pacing

The primary opportunity pages should not each invent their own gap, card padding, and meta spacing.

### 6.3 Card grammar

Public cards should share:

- one light-surface body treatment
- one border and radius rhythm
- one shadow intensity family
- one title typography style
- one metadata style
- one supporting-text tone

This should apply across:

- list cards
- hub cards
- sidebar teaser cards
- detail content cards

### 6.4 CTA hierarchy

Public pages should have a stable CTA hierarchy:

- primary action links
- secondary text links
- teaser / adjacent-route links

The same intent should not appear in three visually unrelated link styles.

### 6.5 Status, badge, and meta language

Badge and metadata styling should read as one system:

- role / mode / status badges already have one direction
- page-level meta rows and card-level meta rows should align with that direction

Metadata should be quieter than titles and actions, but still recognisably part of the same design language.

### 6.6 Detail-page aside language

Public detail pages with sidebars should share a consistent aside treatment:

- teaser cards
- governance / scholar / travel-support sidebars
- preview CTA blocks

These should feel like one family, not like each page has its own sidebar component aesthetic.

## 7. What Must Not Be Unified

The following should remain intentionally distinct:

- homepage hero vs secondary page headers
- public browse surfaces vs authenticated workflow surfaces
- browse pages vs application forms

The goal is coherence, not flattening every page into the same composition.

## 8. Implementation Direction

The preferred implementation direction is:

- preserve `PortalShell`
- preserve route ownership of each page
- introduce a shared public-browse style layer instead of continuing to duplicate near-identical CSS across page files
- let page-specific CSS keep only the layout rules or content exceptions unique to that route

This means the unification should likely happen through:

- shared CSS primitives for public browse pages
- small `PortalShell`-level refinements if needed
- targeted cleanup of repeated page-level rules

It should not happen through:

- a copy-pasted mega stylesheet per page
- rebuilding every route as a homepage variant
- moving public pages into `WorkspaceShell`

## 9. Current Design Debt To Eliminate

This addendum explicitly targets the following existing inconsistencies:

1. The main opportunity pages use one visual grammar, while newsletter / publications / videos / partners / outreach use another.
2. Several page CSS files repeat the same card structure with slightly different values.
3. Some pages rely on older fallback variables such as `--surface-bg`, `--surface-border`, `--text-muted`, and `--brand-strong`, which weakens the current token system.
4. Public detail sidebars and teaser cards do not yet read as one intentional family.

## 10. Approved Rollout Order

### Phase 1: primary chain

Unify the primary browse chain first:

- conferences
- grants
- schools
- scholars
- prizes

This phase should deliver the most visible improvement to the public journey.

### Phase 2: secondary breadth surfaces

Then unify:

- newsletter
- publications
- videos
- partners
- outreach
- governance

This phase should mainly align the site’s long-tail public surfaces with the refined public grammar from Phase 1.

## 11. Success Criteria

This slice is successful when:

- moving from the homepage into public browse pages still feels like one site
- public list and detail pages share one recognizable body style language
- cards, headers, teaser sidebars, and CTA hierarchy feel related across routes
- the homepage remains the most dramatic page without making other public pages feel unfinished
- the public pages look intentionally different from the authenticated workspace

## 12. Non-Goals

This addendum explicitly does not require:

- reordering public route IA
- adding new page features or backend contracts
- giving every public page a dark hero
- redesigning the applicant workspace
- resolving every brand-color question for the whole product in the same pass
