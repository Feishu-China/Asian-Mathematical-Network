# Portal Homepage UI Priority Addendum

Date: 2026-04-27
Status: Draft for review
Type: Incremental addendum to the approved homepage and fidelity specs

References:
- `docs/superpowers/specs/2026-04-26-portal-homepage-m4-design.md`
- `docs/superpowers/specs/2026-04-26-portal-homepage-fidelity-and-return-context-design.md`
- `/Users/brenda/Downloads/asiamath-home-fixed.html`

## 1. Purpose

This addendum converts the current homepage UI critique into an execution order.

The next homepage slice should stop trying to improve everything at once. It should fix the most damaging visual issues first:

1. readability and contrast
2. hero hierarchy
3. palette and component-language consistency
4. masthead density and visual restraint

This addendum does not reopen the homepage information architecture, `M4` placement, or public route map already approved in the earlier specs.

## 2. Approved Direction

The implementation direction is fixed as:

- keep the current React page architecture
- keep the approved homepage section order
- keep the current public module scope
- use the earlier HTML reference as tone guidance, but allow deliberate divergence where the current React homepage needs cleaner hierarchy

The key design judgement in this addendum is:

- visual fidelity to the reference is still desirable
- but legibility and hierarchy take precedence over literal mimicry

If the reference-like treatment and the current content model conflict, the product should prefer the cleaner reading experience.

## 3. Priority Order

### P0. Readability and contrast repair

This is the highest-priority fix.

The current homepage has visible low-contrast failures:

- the hero headline visually sinks into the dark background
- the right-side hero area carries too many mid-tone surfaces
- light-on-light and low-contrast muted text appear inside supporting cards

Required outcome:

- all first-screen headline, body, metadata, and CTA text must read clearly at a glance
- dark-surface text must use explicit dark-surface tokens, not ad hoc opacity values
- no supporting card may rely on “barely-there” contrast for sophistication

### P1. Hero hierarchy simplification

The current hero has too many competing focal points.

The approved hierarchy should become:

1. primary focus: left-side headline, lede, and main CTA cluster
2. secondary focus: right-side summary panel
3. tertiary support: stat strip

Because the page already has a dedicated `Featured opportunities` section below the hero, the nested featured opportunity card inside the right-side summary panel should be removed in this pass.

This is an intentional divergence from the HTML reference.

Reason:

- the duplicated featured opportunity inside the hero creates a third focal point
- it competes with the main headline and the summary panel title
- it weakens the featured-opportunity section below by previewing the same content twice

The summary panel should remain informational and directional, not become a second homepage within the hero.

### P1. Palette recalibration

The current `navy + stone + gold` direction is valid, but the actual values are not yet clean enough.

The palette should be recalibrated so that:

- hero navy feels deeper and more stable
- light surfaces feel cooler and cleaner
- the accent gold is used sparingly as a signal, not as fog or haze
- text colors on dark and light surfaces are explicit token choices

The goal is not a broad brand redesign. The goal is to make the existing direction feel intentional rather than muddy.

### P1. Public component-language consistency

The public homepage currently mixes multiple visual dialects:

- glass-like hero panel
- matte light cards
- rounded primary CTA
- harder-edged outline CTA
- editorial nav

The public-facing surface should converge on one consistent grammar:

- one hero-only translucent panel treatment
- one light-card treatment for all lower sections
- one primary CTA style
- one secondary CTA style
- one shared border-radius rhythm

The public site should feel like one designed object rather than a stack of individually acceptable components.

### P2. Masthead density reduction

The masthead should stay editorial, but it should consume less visual energy.

Desired changes:

- reduce the prominence of the topbar copy
- reduce the visual heaviness of the `Sign in` button
- slightly tighten the nav rhythm so the hero starts sooner

This is a refinement pass, not a navigation rewrite.

### P2. Background and effect restraint

The current hero combines:

- grid
- glow
- blur
- dark gradient

The issue is not that any one effect is wrong. The issue is that the combined stack feels too busy relative to the content.

The next pass should:

- soften the grid contrast
- reduce the gold haze
- keep depth without making the hero look smoky

### P2. Vertical balance

The hero currently spends too much height on atmosphere relative to information.

The next pass should reduce that imbalance by:

- making the heading block slightly more efficient
- improving line breaks
- letting the CTA and stats breathe higher on the page

The homepage should still feel expansive, but less swollen.

## 4. Approved Homepage Deviations From The HTML Reference

The following deviations are approved in this pass:

1. The hero may become cleaner than the HTML reference.
   The current React homepage has a dedicated featured-opportunities section, so the hero does not need to duplicate that section through a full nested card.

2. The palette may move away from the exact screenshot mood if needed for readability.
   High fidelity is still the target, but not at the expense of legibility.

3. The masthead may be slightly quieter than the HTML reference.
   The product already carries more navigable surfaces than the static mockup, so restraint is preferable.

## 5. Scope

This addendum is intentionally narrow.

In scope:

- `/portal` visual hierarchy
- `/portal` hero composition
- homepage color-token recalibration
- public masthead refinement shared by homepage and public browse pages
- public card / CTA consistency where driven by homepage styles

Out of scope:

- new homepage sections
- new data providers
- new backend contracts
- redesigning authenticated dashboard pages
- redesigning application forms
- expanding `M4` beyond the already approved teaser + directory model

## 6. Affected Files

The expected implementation surface for this pass is:

- `frontend/src/pages/Portal.tsx`
- `frontend/src/pages/Portal.css`
- `frontend/src/pages/Portal.test.tsx`
- `frontend/src/components/layout/PublicPortalNav.css`
- `frontend/src/styles/tokens.css`

If small structural adjustments are needed for public CTA consistency, they may also touch:

- `frontend/src/components/layout/PublicPortalNav.tsx`

No broader page-by-page redesign is required by this addendum.

## 7. Success Criteria

This pass is successful when:

- the first screen reads clearly without squinting or “searching” for the headline
- the homepage has one obvious visual focal point rather than three competing ones
- the public palette feels cleaner and more intentional
- cards, buttons, and masthead belong to the same visual system
- the homepage still retains the approved section order and route architecture

## 8. Non-Goals

This pass explicitly does not require:

- final brand-color signoff for the whole product
- redesigning conference, grant, school, or scholar internals beyond inherited masthead changes
- adding motion design or advanced animation
- pixel-perfect cloning of the original HTML screenshot
- changing `WorkspaceShell` application flows in the same slice
