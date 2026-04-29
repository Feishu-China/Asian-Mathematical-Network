## Portal Homepage And M4 Directory Design

Date: 2026-04-26
Scope: Public homepage rebuild for `/portal`, upgraded public role for `M4`, and route-level information architecture for scholar discovery in the demo
Status: Draft for review
Supersedes: `docs/superpowers/specs/2026-04-24-portal-homepage-design.md` where the two documents conflict

## 1. Goal

Refine the public homepage direction so it matches the stronger UI direction represented by the recent homepage reference while staying aligned with the current React/Vite frontend architecture.

This revision introduces a clearer public role for `M4` in the demo:

- `M4` should remain a cross-cutting base module rather than a homepage co-equal to `M2`, `M7`, and `M8`
- `M4` should still become visibly meaningful in the public product story
- the homepage should lightly surface scholars and expertise
- the demo should include a dedicated public scholar directory route
- other demo modules should visibly reuse `M4` as shared scholar and expertise context

## 2. Execution Direction

The implementation direction is fixed as:

- rebuild the homepage through the existing React component architecture
- do not embed the reference HTML directly into the app
- preserve existing provider boundaries and route ownership
- treat the reference HTML as a visual and structural target, not as implementation source

This means the work should be expressed through page components, layout components, feature-level mappers, and route-specific CSS rather than a static HTML transplant.

## 3. Homepage Positioning

The homepage remains the public front door of the network.

Its first job is still to answer:

- what opportunities are open now
- what public modules can I browse
- how do I move toward conferences, grants, schools, prizes, resources, and scholars

Its second job is to establish that this is a real academic network with visible people, expertise, and institutions behind the opportunity surfaces.

The homepage must not turn into:

- a full scholar directory landing page
- an authenticated dashboard
- a governance or workflow entry point
- a broad rewrite of every public module

## 4. M4 Role In The Demo

`M4` should be treated as a visible base layer, not only as a private profile editor plus one isolated scholar detail page.

In the demo, `M4` should play three roles at once:

1. Public credibility layer
   The visitor should be able to see that the network contains real-looking scholars, institutions, and research areas.

2. Directory layer
   The visitor should be able to enter a dedicated scholar-discovery route and browse beyond a single sample profile.

3. Reuse layer
   Other modules should visibly draw on scholar and expertise records so `M4` feels foundational rather than decorative.

This preserves the system-map logic that `M4` supports `M2`, `M3`, `M6`, `M7`, and `M14` while avoiding a homepage that over-centers the directory.

## 5. Public Information Architecture

### Top navigation

The public top navigation should include:

- Conferences
- Travel Grants
- Schools
- Prizes
- Scholars
- Resources

`Resources` remains a lightweight dropdown for:

- Newsletter
- Videos
- Publications

Right-side account behavior remains:

- signed out: `Sign in`
- signed in: `My Applications`

### Homepage section order

The homepage should follow this narrative order:

1. Compact hero
2. Open opportunities
3. Schools and training or other opportunity-adjacent academic programmes
4. `Scholars & Expertise` teaser for `M4`
5. Secondary public breadth sections such as prizes, outreach, or content feeds
6. Member institutions / footer

This order reflects user cognition:

- first: what can I do here now
- second: who and what scholarly network stands behind those opportunities
- third: what longer-tail public content or archive surfaces exist

## 6. Homepage M4 Section

The homepage `M4` section should use the approved `mixed` approach.

### Purpose

The section should:

- strengthen the sense of a live scholarly network
- create a clear path into the scholar directory
- show both people and fields without becoming a full browse surface

### Structure

The section should have two linked parts:

1. Expertise clusters
   Show `4` to `6` research clusters with short labels such as:
   - Algebraic Geometry
   - Number Theory
   - PDE
   - Topology
   - Mathematical Physics
   - Probability

   Each cluster can include a short supporting line such as scholar count, institutions count, or a short descriptor.

2. Featured scholars
   Show `2` to `3` scholar cards with:
   - full name
   - institution
   - country
   - `2` to `4` research keywords or one primary MSC-backed area label
   - link to scholar profile

### Section CTA

The section should end with a single directory CTA such as:

- `Browse Scholar Directory`

The CTA should point to `/scholars`.

### Explicit limits

The homepage `M4` teaser should not include:

- full search UI
- deep multi-filter interaction
- long biographies
- private or reviewer-only context
- full institutional browsing

## 7. Dedicated M4 Routes

### `/scholars`

Add a public scholar directory route for `M4`.

This route should act as the public directory landing page and include:

- page intro explaining the directory's role in the network
- featured expertise clusters or browse chips
- a grid/list of public scholar cards
- links into `/scholars/:slug`
- a lightweight hint of future browsing dimensions such as institution, keyword, and MSC code

The first iteration does not need advanced search or real backend filtering as long as the page reads as a believable public directory surface.

### `/scholars/:slug`

Retain the existing scholar detail route, but reposition it from a standalone sample page into the detail surface of the public directory.

The page should continue to show:

- public-facing scholar identity
- institution and country
- research keywords
- MSC codes
- public bio
- public links such as website or ORCID

The page should avoid private-only fields such as:

- COI declaration text
- verification internals not intended for visitors
- reviewer-only or admin-only notes

## 8. Cross-Module Reuse Rules

To make `M4` function as a base module in the demo, visible reuse should be added or preserved in these places:

### `M2` Conferences

Conference-facing pages should be able to reference scholar context such as:

- featured speaker
- organizer or host scholar
- related scholar profile links

This does not need to become a full participant directory.

### `M3` Applications / review context

Existing reviewer and application detail flows should continue to reuse profile summary or applicant profile snapshot logic rooted in `M4`.

### `M6` Prizes

Prize pages should be able to link laureates, nominees, or sample committee-facing scholar context back to public scholar profiles when appropriate.

### `M14` Partners

Partner-facing teaser copy should continue to frame expert matching as a use of the academic directory rather than as a standalone partner-owned record system.

## 9. Component And Data Boundaries

The homepage rebuild should preserve the React architecture and keep `M4` additions composable.

Recommended boundaries:

- `Portal` remains the homepage page container
- a homepage view-model layer aggregates public opportunity data and `M4` teaser data
- `PublicPortalNav` owns public navigation, including `Scholars`
- a dedicated homepage `M4` teaser component renders the mixed expertise-plus-scholar section
- `/scholars` gets its own page component and its own directory card/list components
- existing profile presentation utilities should be reused where possible so public scholar rendering stays consistent between homepage teaser, directory cards, and scholar detail

Provider strategy should remain aligned with the current demo rule:

- preserve real provider boundaries where already established
- allow `M4` directory list data to begin as fake or hybrid provider data
- do not force a backend search service before the public directory can exist

## 10. Content Rules

`M4` content should read like network infrastructure, not like a social feed.

Preferred signals:

- institution breadth
- country breadth
- research domains
- stable scholarly profiles
- profile links reused by other modules

Avoid:

- promotional profile copy
- informal social-network tone
- private academic evaluation signals
- overclaiming directory completeness

## 11. Non-Goals

This revision does not require:

- a full expert-search backend
- a full institutional directory system
- a redesign of authenticated workspace pages
- deep review-workflow changes
- a full portal-wide IA rewrite outside the homepage and public scholar-discovery path

## 12. Acceptance Criteria

This design is satisfied when:

1. `/portal` is rebuilt through React components rather than a static HTML transplant
2. public navigation includes `Scholars`
3. the homepage includes a lightweight `M4` mixed teaser with both expertise clusters and featured scholars
4. the homepage `M4` teaser links clearly to `/scholars`
5. `/scholars` exists as a public directory page distinct from `/scholars/:slug`
6. `/scholars/:slug` reads as a directory detail page rather than only a sample isolated demo page
7. at least some public or semi-public module surfaces visibly reuse `M4` scholar context
8. the homepage still keeps open opportunities as the primary public story
9. the resulting information architecture feels broader and more network-like without collapsing into a full portal rewrite
