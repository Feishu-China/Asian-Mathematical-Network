# Asiamath Demo Coverage Matrix d0

## Goal

Track the first full-product-shape demo so every module has an explicit touchpoint without redefining MVP core ownership.

## Shared Rules

- Shared route map, object naming, and status semantics stay aligned with the current product and design specs.
- `Portal` entry is in scope for the demo, but the canonical applicant dashboard should not be redefined during breadth work.
- `real-aligned` pages may use real APIs, `hybrid` pages should preserve provider boundaries, and `static-preview` pages are presentation-only for now.

## Module Matrix

| Module | Name | Demo touchpoint | Route or surface | Page mode | Provider strategy | Demo role |
|---|---|---|---|---|---|---|
| `M1` | Public Portal | Landing and public entry | `/` or `/portal` | `hybrid` | `fake provider` | Primary story entry |
| `M2` | Conference Organisation | Conference discovery and application | `/conferences`, `/conferences/:slug`, `/conferences/:slug/apply` | `real-aligned` | `http provider` | Primary story core |
| `M3` | Application System | Applicant and workflow backbone touchpoints | `/me/applications`, `/me/applications/:id`, `/reviewer/assignments/:id`, `/organizer/applications/:id` | `hybrid` | `http + fake provider` | Primary story core |
| `M4` | Academic Directory and Expertise Registry | Profile edit and public scholar context | `/me/profile`, `/scholars/:slug` | `hybrid` | `http + fake provider` | Primary story support |
| `M5` | Newsletter | Archive and detail preview | `/newsletter`, `/newsletter/:slug` | `static-preview` | `static content` | Secondary breadth |
| `M6` | Prizes and Awards | Archive and detail preview | `/prizes`, `/prizes/:slug` | `hybrid` | `fake provider` | Secondary breadth |
| `M7` | Travel Grants and Fellowships | Grant discovery and application | `/grants`, `/grants/:slug`, `/grants/:slug/apply` | `real-aligned` | `http provider` | Primary story core |
| `M8` | Schools and Training | List, detail, and travel-support teaser | `/schools`, `/schools/:slug` | `hybrid` | `fake provider` | Secondary breadth |
| `M9` | Video Library | Video index and detail preview | `/videos`, `/videos/:id` | `static-preview` | `static content` | Secondary breadth |
| `M10` | Governance | Admin-side governance preview | `/admin/governance` | `static-preview` | `static content` | Secondary breadth |
| `M12` | Publications | Publication archive and detail preview | `/publications`, `/publications/:id` | `static-preview` | `static content` | Secondary breadth |
| `M13` | Outreach | Outreach landing | `/outreach` | `static-preview` | `static content` | Secondary breadth |
| `M14` | Industry and Partners | Partners landing and expert-matching teaser | `/partners` | `hybrid` | `fake provider` | Secondary breadth |

## Primary Story Freeze

The primary demo path for `d0` is:

1. Portal entry
2. Conference discovery
3. Conference detail
4. Scholar context
5. Login or register
6. Profile completion
7. Conference application
8. Grant application
9. My applications
10. Reviewer or organizer sample touchpoint

## Breadth Rule

Modules outside the primary story should only deepen past preview level if:

- the route map is already frozen,
- the provider boundary is clear,
- and the added work does not block primary story stability.
