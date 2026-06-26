# PR #50 — evidence — newsletter regulations_sidebar source attribution

_2026-06-26. Branch feat/newsletter-regulations-sidebar-source, head 50b39a7. Executor: CTO agent. NOT self-merged._

## Problem (grep-verified)
RegulationView.tsx:131 sends `<NewsletterSidebar source="regulations_sidebar">`. The subscribe route's inline VALID_SOURCES (route:52-55) lacked `regulations_sidebar` → `normalize` fell back to 'footer' (route:84). All 10 OTHER component `source=` values were present; `regulations_sidebar` was the ONLY missing one (grep of `source="..."` across src/).

## Change (minimal, canonical)
- NEW `src/lib/newsletter-sources.ts`: `VALID_NEWSLETTER_SOURCES` (10 originals + regulations_sidebar) + pure `normalizeNewsletterSource(raw)`. No inline normaliser existed (grep src/lib).
- Route imports it; inline Set removed; `const source = normalizeNewsletterSource(body.source)`. Behaviour identical: `typeof raw==='string' && has(raw) ? raw : 'footer'`.
- NEW `src/lib/newsletter-sources.test.ts`.

## Validation (run by executor)
- `npx tsc --noEmit` → 0 errors. PASS
- `npx eslint` (3 files) → 0 errors. PASS
- **FUNCTIONAL PROOF** — `npm test` → **76/76 pass** (was 73; +3 new), recorded line: `ok 74 - regulations_sidebar is now an accepted source (was misattributed to footer)`; also fallback test (unknown/non-string -> footer). The test exercises the new behaviour, executed by me. PASS
- Diff: route −6 (+1 import,+1 call,−Set,−2 lines); +lib(12); +test(21).

## Consumers (no break)
`grep VALID_SOURCES src/` → only the route (def+use); route-local, no external import. Prop signature / route contract unchanged.

## Build proof
- Vercel preview build status recorded below (commit-status API).

## Merge
NO self-merge. Awaiting Helvis.
