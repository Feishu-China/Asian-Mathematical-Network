# Portal Homepage Supporting Content Design

Date: 2026-04-27
Status: Draft for review
Type: Incremental addendum to the approved portal homepage specs

References:
- `docs/superpowers/specs/2026-04-24-portal-homepage-design.md`
- `docs/superpowers/specs/2026-04-26-portal-homepage-fidelity-and-return-context-design.md`
- `docs/superpowers/specs/2026-04-27-portal-homepage-ui-priority-design.md`
- `docs/planning/asiamath-demo-data-source-matrix-d0.md`
- `docs/product/asiamath-demo-prd-v3.1.md`
- `docs/product/asiamath-mvp-prd-v3.2.md`

## 1. Purpose

The current `/portal` homepage now has the approved section order and stronger visual rhythm, but its supporting sections still read too much like demo explanation instead of a live network front page.

This addendum defines the next homepage slice:

1. remove remaining meta copy that explains product intent to the visitor
2. stop storing homepage-only supporting content directly inside the portal view model
3. make homepage supporting sections read from feature-owned teaser content
4. improve present credibility without forcing immediate backend or database work

This slice is about data ownership and public editorial realism, not about another visual redesign.

## 2. Current Problem

The homepage currently mixes three different content modes:

1. real-aligned public opportunity and scholar data
2. feature-level fake or static content for breadth modules
3. homepage-local explanatory copy written specifically to justify the information architecture

The third category is the problem.

Examples of the current failure mode:

- section descriptions talk about what the homepage is trying to prove instead of what the network is doing
- supporting examples are concrete in wording but still originate as portal-local curation stubs
- some feature sources still present themselves explicitly as preview or placeholder content

As a result, the homepage looks designed, but not fully inhabited.

## 3. Scope

In scope:

- `/portal` supporting content strategy
- homepage teaser ownership for `Prize`, `Outreach`, `From the Network`, and `Institutions & partners`
- homepage copy cleanup for `Hero`, `Opportunities`, and closing-page descriptions where needed
- lightweight fake-data enrichment when required to support believable public teasers
- small provider-boundary upgrades for static breadth modules

Out of scope:

- PostgreSQL migration
- CMS design
- admin authoring workflows
- turning every breadth module into a real backend-managed system
- reopening homepage section order
- adding a public `jobs` module

## 4. Approved Direction

The homepage should stop behaving like the place where supporting content is invented.

The approved direction is:

- each feature owns its own teaser-ready public records
- the homepage aggregates and selects from those records
- the homepage may still apply ordering and composition decisions
- the homepage should not carry explanatory product-language that belongs in specs or internal docs

This means the portal becomes an editorial front page built from module-owned content, even while several modules still rely on fake providers or static-preview data.

## 5. Data-Ownership Rules

### 5.1 Portal ownership

`frontend/src/features/portal/homepageViewModel.ts` should own:

- homepage layout-level aggregation
- section ordering
- selection of which teaser records appear on the homepage
- small homepage-only framing fields that are truly presentational

It should not own:

- fake prize entries
- fake outreach program entries
- fake newsletter, publication, or video stories
- fake partner records
- long explanatory summaries whose only purpose is to defend the homepage architecture

### 5.2 Feature ownership

Each supporting module should own the records that the homepage reuses:

- `Prize` owns prize archive teaser items
- `Outreach` owns outreach program teaser items
- `Newsletter`, `Publications`, and `Videos` own network-story source items
- `Partners` owns institution / partner teaser items

The homepage may map or trim those records, but should not re-author them from scratch.

## 6. Provider Strategy

The data-source matrix already defines the intended split:

- `/portal` is `hybrid`
- `Prize` is `fake provider`
- `Partners` is `fake provider`
- `Newsletter`, `Videos`, `Publications`, and `Outreach` are still `static content`

This addendum keeps that overall direction, but tightens one rule:

- if a supporting module is now important enough to supply homepage teaser content, it should expose that content through a feature-level interface rather than a page-level direct import

Therefore:

1. `Prize` and `Partners` should continue through feature providers
2. `Outreach`, `Newsletter`, `Publications`, and `Videos` should move from raw page-local static arrays toward minimal fake-provider or feature-source boundaries
3. the change does not require HTTP providers yet

The goal is not “make everything real now”. The goal is “make future replacement localized”.

## 7. Fake-Data Policy

Additional fake data is allowed and expected in this slice.

However, the fake data must change style:

- no `Preview`, `placeholder`, `concept`, or `static issue preview` phrasing in visitor-facing titles
- no summaries whose main job is to explain future product potential
- prefer concrete records with plausible dates, institutions, locations, speakers, or programme relationships
- preserve the current Asiamath network story: conferences, travel support, schools, scholars, institutions, and public-facing traces

Good fake data should behave like a believable editorial seed set, not like a product note.

## 8. Target Module Changes

### 8.1 Prize

Keep the current fake-provider boundary.

Adjust the content so homepage teaser items feel like:

- public archive signals
- released citations
- named cycles or laureates

Do not frame them as process explanation when surfaced on the homepage.

### 8.2 Outreach

Introduce a feature-owned source boundary for outreach teaser records.

The page may still be static-preview in overall mode, but the data should become reusable by the homepage without the homepage rewriting it.

### 8.3 Newsletter / Publications / Videos

These three modules currently provide strong candidates for the homepage `From the Network` section, but their content still carries preview language.

This slice should:

- keep them static or fake-backed as needed
- rewrite source records into believable public artifacts
- allow the homepage to pull a small mixed editorial set from them

### 8.4 Partners

Keep the partner data feature-owned and fake-backed.

The homepage closing strip should draw from actual partner records or institution-like records owned by the partner feature, not from a portal-local hardcoded label list.

## 9. Copy Rules

The homepage should speak to visitors, not to internal reviewers.

Remove or rewrite copy that does any of the following:

- explains why the homepage was structured this way
- argues that modules have been unified
- mentions demo mechanics, placeholders, previews, or future system plans
- describes what the product could later become

Acceptable homepage copy should instead:

- describe current opportunities, people, outputs, or institutions
- point to concrete public traces of network activity
- maintain editorial tone without internal product narration

## 10. Migration Path To Real Backend Data

This slice must reduce, not increase, future migration cost.

The expected migration sequence is:

1. feature-owned fake/static records become feature-owned provider outputs
2. homepage aggregation consumes those outputs
3. a future real backend or CMS replaces individual providers one module at a time
4. homepage composition remains largely stable

If this boundary is respected, later backend adoption should mostly require:

- replacing provider implementation
- adjusting field mapping
- refreshing tests

It should not require a homepage structural rewrite.

## 11. PostgreSQL Position

PostgreSQL migration is not a prerequisite for this slice.

Reason:

- current homepage realism issues are primarily caused by content ownership and copy strategy
- the current backend still uses Prisma with SQLite
- several affected modules are not backend-managed at all yet

Therefore the approved sequencing is:

1. fix provider boundaries and supporting-content realism first
2. later decide which breadth modules warrant real persisted objects
3. only then evaluate whether PostgreSQL migration should accompany that backend expansion

This addendum intentionally avoids coupling homepage improvement to database-engine change.

## 12. Affected Files

Expected implementation surface:

- `frontend/src/features/portal/homepageViewModel.ts`
- `frontend/src/features/portal/homepageViewModel.test.ts`
- `frontend/src/pages/Portal.tsx`
- `frontend/src/pages/Portal.test.tsx`
- `frontend/src/features/prize/*`
- `frontend/src/features/outreach/*`
- `frontend/src/features/newsletter/*`
- `frontend/src/features/publication/*`
- `frontend/src/features/video/*`
- `frontend/src/features/partner/*`

Page components may need small adjustments, but the main responsibility change should happen in feature content ownership and homepage aggregation.

## 13. Success Criteria

This slice is successful when:

1. the homepage no longer contains obvious meta copy about homepage strategy
2. `Prize`, `Outreach`, `From the Network`, and `Institutions & partners` read like live public sections rather than demo notes
3. supporting homepage content is sourced from module-owned records rather than rewritten portal-local arrays
4. at least one future module can swap from fake/static source to a real provider without requiring `Portal.tsx` to be redesigned
5. the implementation stays consistent with the demo data-source matrix and does not force immediate backend schema work

## 14. Non-Goals

This slice does not require:

- building a jobs surface
- implementing a CMS
- adding moderation or authoring UI
- inventing permanent backend contracts for static-preview modules before they need them
- upgrading all breadth modules to HTTP providers in one pass
