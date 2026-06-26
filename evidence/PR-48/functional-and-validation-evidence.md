# PR #48 — evidence (mrprops-content) — clickability fix on /regulations

_2026-06-26. Branch `fix/regulations-clickability-aschild`, head 1554ad7f. Executor: CTO agent. NOT self-merged._

## Problem (live-confirmed on prod before fix)
Rental-type pills, pagination, and hero "Read the Guide" rendered `<Link><Button>`/`<Link><button>` → invalid `<a><button>` nesting; the inner button swallowed the click. Live test on mrprops.io: clicking "Airbnb" pill and pagination "2" did NOT navigate (URL unchanged). Cards (`<Link><div>`) and region pills (`<button onClick>`) worked.

## Fix
- Hero CTA + pagination (shadcn Button): canonical `<Button asChild><Link/></Button>` (matches 14 existing usages; button.tsx uses Radix Slot).
- Rental-type pills (raw button): classes moved onto `<Link>`.
- Pagination: `pageHref("/regulations", …)` → `pageHref(basePath, …)` so facet pagination keeps the platform.

## Validation (commands run by executor, this branch)
- `npx tsc --noEmit` → EXIT 0, 0 errors (baseline 0). PASS
- `npm test` (`tsx --test src/lib/*.test.ts`) → tests 73, pass 73, fail 0 (baseline 73/73). PASS
- `npx eslint <file>` → 0 errors, 2 warnings (pre-existing: Sparkles import, platformLabel — untouched lines). PASS
- Re-grep `<Link>`-wrapping-`<button>` in file → 0 occurrences. PASS
- git diff → 1 file, +32/-35, isolated to the 3 bug sites. PASS

## Build proof (Vercel preview, verified via GitHub commit status API — not PR prose)
- `Vercel` status = **success** on head 1554ad7f. Preview: mrprops-content-git-fix-regul-1dc564-helvijs-schmoteks-projects.vercel.app

## Functional proof (Chrome, on the Vercel preview build)
- Navigate preview `/regulations` → click "Airbnb" rental-type pill → URL became `/regulations/airbnb`, title "Airbnb Regulations", pill activated. (Was dead before.) PASS
- On `/regulations/airbnb`, click pagination "2" → URL became `/regulations/airbnb?page=2`, title "Airbnb Regulations — Page 2", page-2 active. Proves clickability AND the basePath fix (platform segment preserved). PASS

## CI note (read the OUTPUT, per contract)
- "CC↔Live parity (20-piece sample)" check = FAILURE, but on an UNRELATED piece: `airbnb-depreciation-calculator` (a /tools/ calculator) "24 phantom words on live", live-in-cc 86.4% < 88%. My diff touches only RegulationsIndexClient.tsx (no content/calculator). The check is advisory (continue-on-error) and passes on main with a different random sample. NOT caused by this PR. Documented as a separate issue to report.

## Consumers (no break)
- Consumers: `src/app/regulations/page.tsx`, `src/app/regulations/[platform]/page.tsx` — both read `searchParams.page`, pass `currentPage`/`currentPlatform`. Prop signature unchanged → no consumer break.

## Discovered issues (reported separately, NOT fixed here)
1. `src/components/client/TaxesIndexClient.tsx` — comment "Same pattern as RegulationsIndexClient" → likely identical broken pills/pagination on /taxes. Needs the same fix.
2. Hero/card `href` uses `slug.split("/").pop()` → links to the OLD short URL (301 hop) for nested slugs. Preserved as-is (out of scope).
3. CC↔Live parity drift: `airbnb-depreciation-calculator` has 24 phantom words on live vs CC.

## Merge
NO self-merge. Awaiting Helvis Two-Key / explicit merge.
