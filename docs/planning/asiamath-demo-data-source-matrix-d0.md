# Asiamath Demo Data Source Matrix d0

## Goal

Record which demo surfaces should use real HTTP data, fake providers, or static-preview content so later integration work stays controlled.

## Provider Modes

- `http provider`: page uses real API responses and current backend contracts.
- `fake provider`: page uses the same feature interface as production-facing pages, but returns demo data locally.
- `static content`: page is presentation-only and does not need a provider contract yet.

## Route and Module Matrix

| Surface | Module | Page mode | Data source now | Future direction | Notes |
|---|---|---|---|---|---|
| `/` or `/portal` | `M1` | `hybrid` | `fake provider` | Keep provider boundary and later add real aggregate entry if needed | In scope for demo, but do not redefine canonical applicant dashboard ownership |
| `/login`, `/register` | Shared foundation | `real-aligned` | `http provider` | Keep real | Needed for primary story credibility |
| `/me/profile` | `M4` | `real-aligned` | `http provider` | Keep real | Existing real profile flow should stay usable |
| `/scholars/:slug` | `M4` | `hybrid` | `fake provider` or `http provider` | Prefer real if public profile data is stable | Can start fake to avoid coupling breadth work to visibility edge cases |
| `/conferences` | `M2` | `real-aligned` | `http provider` | Keep real | Existing core discovery surface |
| `/conferences/:slug` | `M2` | `real-aligned` | `http provider` | Keep real | Existing core detail surface |
| `/conferences/:slug/apply` | `M2` | `real-aligned` | `http provider` | Keep real | Existing core application surface |
| `/grants` | `M7` | `real-aligned` | `http provider` | Keep real | Existing grant discovery surface |
| `/grants/:slug` | `M7` | `real-aligned` | `http provider` | Keep real | Existing grant detail surface |
| `/grants/:slug/apply` | `M7` | `real-aligned` | `http provider` | Keep real | Existing grant application surface |
| `/me/applications` | `M3` | `real-aligned` | `http provider` | Keep real | Existing aggregate touchpoint for primary story |
| `/me/applications/:id` | `M3` | `hybrid` | `fake provider` first | Later move to `http provider` | Use shared shell and current status semantics |
| `/reviewer/assignments/:id` | `M3` | `hybrid` | `http provider` or `fake provider` | Prefer real for at least one sample flow | Enough to show assigned review and conflict awareness |
| `/organizer/applications/:id` | `M3` | `hybrid` | `fake provider` first | Later move to `http provider` | Keep source module and decision visibility explicit |
| `/schools`, `/schools/:slug` | `M8` | `hybrid` | `fake provider` | Later add `http provider` if M8 enters MVP scope | Add travel-support teaser linking conceptually to grants |
| `/prizes`, `/prizes/:slug` | `M6` | `hybrid` | `fake provider` | Later add `http provider` if nomination workflow becomes real | Good candidate for fake provider because list/detail semantics are stable |
| `/newsletter`, `/newsletter/:slug` | `M5` | `static-preview` | `static content` | Can stay static until content system exists | Presentation-only for d0 |
| `/videos`, `/videos/:id` | `M9` | `static-preview` | `static content` | Can stay static until media system exists | Presentation-only for d0 |
| `/publications`, `/publications/:id` | `M12` | `static-preview` | `static content` | Can stay static until publication system exists | Presentation-only for d0 |
| `/outreach` | `M13` | `static-preview` | `static content` | Can stay static until outreach program needs backend support | Presentation-only for d0 |
| `/partners` | `M14` | `hybrid` | `fake provider` | Later add `http provider` if partner records become managed objects | Can show expertise-matching teaser without backend dependency |
| `/admin/governance` | `M10` | `static-preview` | `static content` | Can stay static until governance engine work exists | Preview, not full governance system |

## Demo Data Rules

- Mock and fake data should use real-seeming titles, institutions, deadlines, and statuses.
- Fake provider data should live close to the owning feature, not scattered inside page components.
- Primary story surfaces should prefer current backend contracts when they are already stable.
- New breadth routes should not force backend schema or deployment work during `d0` unless they directly support the primary story.

## Integration Rules

- Every new breadth page must declare one of `http provider`, `fake provider`, or `static content` before implementation starts.
- If a page starts as `fake provider`, keep the same feature-facing interface so later HTTP adoption stays localized.
- If a page starts as `static content`, do not invent backend contract details prematurely; upgrade it to `fake provider` first if integration becomes likely.
