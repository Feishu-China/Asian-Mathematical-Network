# Portal Homepage Fidelity And Return-Context Addendum

Date: 2026-04-26
Status: Draft for review
Type: Incremental addendum to the approved homepage and M4 design

References:
- `docs/superpowers/specs/2026-04-26-portal-homepage-m4-design.md`
- `docs/superpowers/plans/2026-04-26-portal-homepage-m4-implementation.md`
- `/Users/brenda/Downloads/asiamath-home-fixed.html`

## 1. Purpose

This addendum narrows the next implementation slice to two concrete goals:

1. raise the public homepage to a high-fidelity visual implementation that is intentionally close to the approved HTML reference
2. repair the public return-navigation chain so portal-led browsing does not strand visitors inside secondary public pages

This is not a new homepage architecture pass. The React route structure, public content order, and `M4` placement approved in the earlier spec remain valid.

## 2. Approved Direction

The implementation direction is fixed as:

- preserve the current React component architecture
- preserve the current homepage information architecture and `M4` teaser structure
- treat `/Users/brenda/Downloads/asiamath-home-fixed.html` as the visual fidelity target for the homepage
- treat return-context repair as a public navigation contract, not as isolated per-page patching

The homepage should become visually much closer to the reference HTML without regressing the cleaner React data boundaries already established.

## 3. Scope

This addendum only covers:

- homepage visual fidelity for `/portal`
- public masthead and homepage-adjacent styling needed to support that fidelity
- public return-context continuity from homepage nav to list pages to detail pages

This addendum does not reopen:

- homepage data sourcing
- backend APIs
- authenticated dashboard IA
- advanced scholar search or filtering
- full-page redesigns for conferences, grants, schools, prizes, or scholars beyond return-link consistency

## 4. Homepage Fidelity Requirements

The rebuilt homepage should intentionally resemble the reference HTML in tone, rhythm, and hierarchy, not just section order.

### 4.1 Required visual traits

The public homepage should include the following traits in the React implementation:

- a slim topbar above the main navigation
- an editorial-style masthead rather than the current rounded app-nav feel
- a dark hero with stronger contrast, layered background treatment, and more dramatic typography
- a right-side hero panel that reads like a featured summary card rather than a generic status box
- a visible stat strip or equivalent quantitative summary treatment in the hero zone
- section labels, card tags, and spacing that feel closer to the HTML reference than the current generic portal treatment
- stronger distinction between hero, opportunities, schools, `M4`, and lower-breadth sections

### 4.2 Fidelity target

The goal is high fidelity, not literal DOM copying.

That means:

- visual composition should be recognisably close to the reference
- typography, spacing, colour contrast, and section pacing should feel intentionally matched
- implementation should still use existing React pages, feature mappers, and reusable components

It does not require:

- copying the exact HTML structure node-for-node
- copying every section from the reference if it exceeds the approved homepage content model
- importing the HTML file directly

### 4.3 Homepage structure constraints

The section order already approved remains:

1. hero
2. featured opportunities
3. schools / training
4. `Scholars & expertise`
5. secondary breadth surfaces when present

Visual fidelity work may strengthen the hero and section transitions, but it should not move `M4` ahead of opportunities or collapse the page back into a static mockup.

## 5. Public Return-Context Contract

The portal should behave like a stable public starting point.

When a visitor starts from `/portal`, the public browsing chain should preserve that origin unless a more specific parent page takes precedence.

### 5.1 Required behaviour

The following contract should hold:

- top navigation links clicked from `/portal` should carry a `Back to portal` return context into public destination pages
- public list pages entered from the portal should preserve that return context when linking into detail pages
- detail pages reached from those list pages should continue to expose a working return link
- secondary public hops originating from a detail page may replace the immediate label with a more local parent such as `Back to school`, but should not lose the upstream portal context nested inside state

### 5.2 Practical implication

This should be treated as one chained state model:

- portal
- public list page
- public detail page
- adjacent public breadth page if applicable

The implementation should prefer shared helpers and consistent propagation over one-off manual state wiring.

## 6. Affected Surface Area

The main code surface for this addendum is expected to stay narrow:

- `frontend/src/pages/Portal.tsx`
- `frontend/src/pages/Portal.css`
- `frontend/src/components/layout/PublicPortalNav.tsx`
- `frontend/src/components/layout/PublicPortalNav.css`
- `frontend/src/styles/tokens.css`

Return-context repair may also touch the specific public pages or cards that currently drop state, especially:

- list pages such as schools and scholars
- list-card or summary-card link components
- detail pages that currently hardcode back links instead of reading chained return context

## 7. Testing Expectations

This slice should add or update tests for two behaviours:

1. visual-structure contract
   the homepage test suite should assert the new high-fidelity structural affordances that matter for the reference-driven design, such as topbar presence, stronger hero summary treatment, and any newly introduced labeled substructures

2. return-context continuity
   public navigation tests should verify that portal-origin links carry return state, and at least one affected list-to-detail chain should prove that the return link remains visible and correct after navigation

The tests do not need to snapshot CSS, but they should lock the user-visible structure and navigation behaviour that defines this addendum.

## 8. Non-Goals

This addendum explicitly does not require:

- a full rewrite of public list/detail layouts outside the homepage
- pixel-perfect cloning of every reference section
- new backend contracts for homepage stats or scholar search
- redesigning authenticated account menus as part of the same slice
- touching unrelated in-progress workspace changes

## 9. Success Criteria

This slice is successful when:

- `/portal` looks intentionally close to the reference HTML rather than merely sharing section order
- the page still uses the current React architecture and existing homepage data model
- visitors entering public pages from homepage navigation can reliably return through the public chain
- tests and build remain green after the visual and navigation updates
