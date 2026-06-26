# PR #49 — evidence — Article schema + dateModified on /regulations

_2026-06-26. Branch feat/regulations-article-schema, head 683cbd9. Executor: CTO agent. NOT self-merged._

## What / why
Regulation detail route emitted only Breadcrumb + FAQ JSON-LD — no Article, so no `dateModified` for Google. Added `createArticleSchema({headline,description,path,datePublished:reg.publishedAt,dateModified:reg.updatedAt})` to `buildStructuredData`. Canonical: identical wiring to guides route (`src/app/guides/[slug]/page.tsx:41`). Rule-compliant: metadata home for the timestamp per FIX-007 (no body/visible change). Real last-modified date (honest freshness), not a fake monthly bump.

## Validation (run by executor, this branch)
- `npx tsc --noEmit` → 0 errors. PASS
- `npm test` → 73/73. PASS
- `npx eslint <route>` → 0 errors/0 warnings. PASS
- diff: 1 file (the route), +11/-1. PASS

## Build proof
- Vercel preview build = success on head 683cbd9 (commit-status API). PASS

## Functional proof (Chrome JS on the authed Vercel preview; raw curl blocked by Vercel SSO)
Ran `document.querySelectorAll('script[type="application/ld+json"]')` on preview `/regulations/general/airbnb-rules-tennessee`:
- ld+json now contains @types: **BreadcrumbList, Article, FAQPage** (was Breadcrumb+FAQ only).
- `Article.dateModified = "2026-06-02T20:29:34.922+00:00"`, `datePublished` same, headline "Airbnb Rules Tennessee…". PASS — the change emits Article+dateModified as intended.

## Scope note / flagged to Helvis
- VISIBLE "Updated {Month YYYY}" badge intentionally NOT added — it would reverse RegulationView FIX-007 (universal "no Last Updated in body" rule). Awaiting Helvis decision; this PR delivers the rule-compliant metadata lever only.

## Merge
NO self-merge. Awaiting Helvis.
