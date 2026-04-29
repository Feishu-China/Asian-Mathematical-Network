# Portal Homepage Design

Date: 2026-04-24
Scope: Public homepage and first-screen information architecture for the Asiamath portal
Status: Draft for review

## 1. Goal

Define a homepage direction that works as the public front door for the Asiamath network without waiting for every portal module to be fully implemented.

This first iteration should:

- make the public modules discoverable from the top navigation
- present the site as an active academic network rather than a static brochure
- keep account actions visible but secondary to public discovery
- support the existing demo path without exposing internal reviewer or organizer surfaces

This iteration should not attempt a full visual redesign of the whole site. The priority is structure, navigation, first-screen clarity, and believable content presentation.

## 2. Design Principles

1. Public-first, account-aware
   The homepage is primarily for visitors discovering opportunities and content. Account actions should remain visible, but not dominate the public entry experience.

2. Navigation and content should not repeat each other
   The top navigation handles module discovery. The first content block should show live-looking public opportunities, not another layer of category routing.

3. Fake data must behave like real data
   Since current homepage content will use fake data, the presentation should still read as current open opportunities rather than placeholder cards.

4. Keep the first iteration narrow
   The homepage should focus on top-level discoverability and the first screen. It should not expand into a full portal IA rewrite.

## 3. References and Direction

The design direction draws from the following references:

- `asiamath_blue_relayout_v11_compact_hero.html`
- `asiamath_home_style_restrained_academic_v12_hifi_discovery_network.html`
- earlier `asiamath-home.html` and `asiamath-home-v2.html`
- `asiamath_system_map.html`

The selected direction is:

- use the compact header and calmer first-screen density from the blue layout
- use the public discovery logic from the restrained academic / system-map directions
- avoid a full aesthetic rewrite in this phase

## 4. Target User Modes

### Visitor mode

Primary questions:

- What does this network offer?
- What opportunities are open now?
- Where can I browse conferences, grants, schools, prizes, and public resources?

### Signed-in applicant mode

Primary questions:

- How do I sign in quickly?
- After sign-in, where do I return to my application workspace?

The homepage should support both modes, but the visible structure on the public page should remain centered on visitor discovery.

## 5. Top Navigation

### Public navigation

The top navigation will contain these public items:

- Conferences
- Travel Grants
- Schools
- Prizes
- Resources

### Right-side actions

For signed-out users:

- Sign in

For signed-in users:

- show `My Applications` on the right side
- do not keep `Sign in` as a visible primary action in the same state

### Styling rule

Navigation items are plain text links.

`Sign in` must be visually distinct from those links:

- render as a solid primary button
- do not add an obvious outline/button border
- differentiate through fill color, weight, and placement on the right side

### Resources behavior

`Resources` should be a simple dropdown, not a standalone landing page in this phase.

Dropdown items:

- Newsletter
- Videos
- Publications

### Prizes behavior

`Prizes` should lead to a hub page with two clear internal entry points:

- Current Calls / Nominations
- Archive / Past Laureates

This avoids forcing prizes into either a purely active-call model or a purely archival model.

## 6. Hero

The hero should be compact and content-supporting, not a long institutional statement.

### Left column

Content hierarchy:

- eyebrow: `Asian Mathematical Network`
- one-sentence headline describing the site as an academic opportunity and exchange network
- short supporting description mentioning conferences, travel grants, schools, and scholarly exchange

### Hero CTAs

Use content-oriented actions rather than account-oriented actions:

- primary CTA: `Browse Conferences`
- secondary CTA: `Explore Travel Grants`

The hero should not use sign-in as its primary action because account access is already handled in the top-right navigation.

### Right column

Use a lightweight summary panel inspired by the compact hero reference.

Suggested contents:

- `Open now` label
- counts or summaries for open conferences, grants, and schools
- one short credibility/status note such as travel support availability or upcoming deadlines

Purpose:

- make the page feel live
- provide quick scanning value without turning the right column into a dashboard

## 7. First Content Block: Public Opportunity Cards

Immediately below the hero, the homepage should display public opportunity cards rather than category split cards.

### Why

The top navigation already provides category routing. Repeating that routing again below the hero would make the page feel like a directory instead of an active network.

### Card set for v1

Show three featured cards:

- one Conference
- one Travel Grant
- one School

### Card contents

Each card should include:

- type label
- title
- time or date range
- location
- status such as `Open` or `Upcoming`
- one-sentence summary
- `View details`

### Data rule

Use fake data for now, but write and structure it like believable live opportunities.

Avoid:

- placeholder copy
- generic lorem-style descriptions
- labels that reveal the card is a mock

## 8. Secondary Homepage Structure

After the hero and featured opportunity cards, any secondary homepage sections in this phase should be limited to public content areas such as:

- prize teaser
- resource highlights
- newsletter / video / publication previews

These are secondary to the first-screen experience and should not compete with the hero and opportunity cards in the initial implementation.

## 9. Interaction Rules

### Signed-out behavior

- public navigation works normally
- clicking protected destinations should route users through sign-in

### Signed-in behavior

- top-right area gains `My Applications`
- homepage still remains a public-facing discovery page rather than turning into a dashboard

### Resources dropdown

- use a simple lightweight dropdown that follows existing frontend interaction patterns
- no mega menu in this iteration

### Mobile

On mobile:

- collapse navigation into a menu
- keep `Sign in` visually distinct inside the menu or at the top of the drawer
- preserve the priority order: public modules first, account action second
- keep the first opportunity cards visible without excessive scroll before first interaction

## 10. Content Priorities

Highest priority content:

- open opportunities
- discoverable public modules
- clear sign-in path

Lower priority content:

- long institutional narrative
- deep archival browsing
- internal/admin pathways

Explicitly out of scope for the homepage top level:

- reviewer entry points
- organizer entry points
- governance surfaces
- partner/admin internal workflows

## 11. Non-Goals

This spec does not cover:

- full redesign of all portal pages
- final visual polish system across every route
- authenticated dashboard redesign
- data architecture changes beyond what is needed to feed the homepage with fake or future real content

## 12. Acceptance Criteria

The homepage first iteration is successful if:

1. a first-time visitor can identify the major public modules from the top navigation within a few seconds
2. `Sign in` is immediately recognizable as the account action because it is visually distinct from nav links
3. the hero explains the network in one scan without feeling oversized or brochure-like
4. the first content block looks like currently available opportunities rather than generic categories
5. `Resources` stays lightweight through a simple dropdown
6. `Prizes` can serve both current-call and archive use cases through its hub entry
7. the signed-in state can expose `My Applications` without changing the homepage into an applicant dashboard

## 13. Implementation Notes for Next Phase

The implementation plan should focus on:

- top navigation structure and auth-aware right-side actions
- simple `Resources` dropdown
- compact hero layout
- fake-data featured opportunity cards
- signed-in conditional `My Applications`

The implementation plan should not begin with broad styling refactors.
