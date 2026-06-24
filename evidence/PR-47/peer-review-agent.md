VERDICT: APPROVED

Fresh-context Layer-4 review of PR #47 (feat/regulations-newsletter-sidebar, stacked on fix/regulations-checklist-relocation = #46). Delta = NewsletterSidebar + RegulationView swap only. Every item verified against code; nothing trusted from prior agents.

## 1. Real subscribe wiring, not a fake form — PASS
src/components/newsletter/NewsletterSidebar.tsx:
- POSTs to /api/newsletter/subscribe (L43) with method POST + JSON content-type.
- Body includes honeypot `website` field (L48), plus email/source/source_url.
- Calls all three analytics trackers: trackNewsletterAttempt (L40), trackNewsletterError (L55, L63), trackNewsletterSuccess (L60).
- Handles states: idle/loading/success/alreadyMember/error (State type L26; success L70-74, alreadyMember via Boolean(json?.alreadyMember) L59, error on !res.ok L52 and catch L62).
- Mirrors NewsletterCTA.tsx logic line-for-line (same fetch, honeypot, tracker calls, state machine).
- Endpoint exists: src/app/api/newsletter/subscribe/route.ts (7465 bytes). Response contract confirmed: success {captured:true, alreadyMember:bool} (route L123/L199), errors return {error} + non-2xx (L88 400, L108 429, L149 500). Component reads alreadyMember + !res.ok correctly.
  cmd: `ls src/app/api/newsletter/subscribe/route.ts` -> present; `grep -n 'fetch("/api/newsletter/subscribe"\|trackNewsletter' NewsletterSidebar.tsx`

## 2. Copy is exactly the approved text — PASS
- HEADLINE (L28): "Join hosts running smarter portfolios" — exact.
- SUBHEAD (L30): byte-identical to approved string (note: literal hyphen " - ", "100s", "STRs + LTRs", "Globe.").
  cmd: node extracted the SUBHEAD literal and JSON.stringify matched expected char-for-char.
  NOTE: NewsletterSidebar hardcodes its own HEADLINE/SUBHEAD consts and does NOT reuse NewsletterCTA's DEFAULT_SUBHEAD (which differs: "Get weekly... 6 mixed STR + LTR units in Europe."). Intentional — sidebar copy is the new approved variant.

## 3. Wiring + cleanup in RegulationView.tsx — PASS
- <NewsletterSidebar source="regulations_sidebar" /> renders inside the sticky sidebar (L131, within `<div className="sticky top-24 space-y-8">`).
- Old per-page sidebarCta* card block removed; `sidebarCta` now appears ONLY in the explanatory comment (L126/L129), no JSX read of those fields.
- Unused Button import removed (import gone from L4); ZERO remaining `<Button` JSX in the file.
  cmd: `grep -n 'NewsletterSidebar\|sidebarCta\|<Button\|from "@/components/ui/button"' RegulationView.tsx` -> only import L5, comment L126/L129, render L131.

## 4. Does NOT regress #46 — PASS
- Opt-in relocate strip intact: stripRedundantBodyBlocks(regulation.bodyHtml, { relocateComplianceChecklist: true }) at RegulationView L20.
- Bottom detailed checklist intact: extractComplianceChecklistSection(regulation.bodyHtml) L22; rendered bottom block + comment L112-116.
- Top structured interactive checklist card intact: L86-97 (checklistItems map under TOC).
- TOC entry for relocated checklist intact: L78-81 (detailedChecklistId anchor li).
- Committed test PASSES: `npx tsx --test src/lib/markdown-to-html.test.ts` -> tests 6, pass 6, fail 0, duration ~100ms. (Includes the #46-added "opt-in relocate + extract" subtests #5/#6.)

## 5. No new shared-lib/global risk — PASS
- NewsletterSidebar imports only: react (useState), lucide-react (Check), next/link, @/components/ui/input, @/components/ui/button, @/lib/analytics. No import of markdown-to-html or stripRedundantBodyBlocks.
  cmd: `grep -n 'stripRedundantBodyBlocks\|markdown-to-html' NewsletterSidebar.tsx` -> none.
- Consumers: only RegulationView.tsx imports/renders NewsletterSidebar.
  cmd: `grep -rn 'NewsletterSidebar' src/` -> NewsletterSidebar.tsx (def) + RegulationView.tsx (import L5, render L131) only.

## 6. tsc / lint — PASS
- `npx tsc --noEmit` -> exit 0, 0 `error TS` lines.
- `npx eslint NewsletterSidebar.tsx RegulationView.tsx` -> exit 0, no errors/warnings. No NEW lint issues vs pre-existing.

## 7. Other issues — minor, non-blocking
- Honeypot a11y: GOOD. <label> wraps the hidden input, aria-hidden="true", off-screen via absolute left/top -9999px, tabIndex=-1, autoComplete="off". Screen readers + keyboard skip it; bots fill it. Route returns {captured:true} 200 on honeypot hit (L79) so the UI shows generic success — correct silent-drop behavior.
- Duplicate ids: GOOD. Honeypot id is source-scoped `nl-side-website-${source}` and differs from NewsletterCTA's `nl-cta-website-${source}`, so no collision even if both ever co-render.
- key props: GOOD. The only mapped list in scope (#46 checklist L94) carries key={i}; NewsletterSidebar renders no lists.
- Email input a11y (MINOR, pre-existing parity): the visible email <Input> has only a placeholder, no <label>/aria-label. This is identical to NewsletterCTA, so it is NOT a regression introduced by #47 — flag for a future a11y sweep across both components, not a blocker here.
