VERDICT: APPROVED

Layer-4 fresh-context review of PR #44 (branch fix/regulations-single-checklist, hello760/mrprops-content).
3 files changed: RegulationView.tsx (-83/+62 net), markdown-to-html.ts (+42, purely additive), new NewsletterSidebar.tsx (+134). `npx tsc --noEmit` -> EXIT 0. `npx eslint` on all 3 changed files -> EXIT 0.

== A. REQ 1 (newsletter copy + real wiring) — PASS ==
- Headline kept exactly: NewsletterSidebar.tsx:28 `const HEADLINE = "Join hosts running smarter portfolios";`
- Body copy BYTE-EXACT to spec (verified via python string equality, MATCH==True): NewsletterSidebar.tsx:30
  "Weekly tips on hybrid portfolios, off-season flips, and the unit economics most operators miss - from Helvis and our community, who run 100s of STRs + LTRs around the Globe."
- Real subscribe wiring: POST /api/newsletter/subscribe (NewsletterSidebar.tsx:47). Route exists (src/app/api/newsletter/subscribe/route.ts). Not a fake form.
- Honeypot preserved: `website` state + off-screen label/input (lines 34, 50/52, 93-103), submitted in body — mirrors NewsletterCTA.tsx (website at :40/:58).
- Analytics preserved: trackNewsletterAttempt/Success/Error imported from @/lib/analytics (all three exist: analytics.ts:197/204/220), called on attempt/success/error (lines 45, 61, 66, 70). idle/loading/success/alreadyMember/error states all handled.
- Rendered once in the right sidebar: RegulationView.tsx:132 `<NewsletterSidebar source="regulations_sidebar" />`, replacing the old per-page sidebarCta* box.

== B. REQ 2 (keep BOTH checklists, repositioned) — PASS ==
- SHORT interactive structured card still gated `checklistItems.length > 0` (RegulationView.tsx:89) and positioned AFTER the Table of Contents (TOC h3 at :68, card at :89) with real <input type="checkbox"> markup (:93). 
- DETAILED body checklist relocated to BOTTOM: detailedChecklistHtml = extractComplianceChecklistSection(regulation.bodyHtml) (:26), rendered at :117-120 AFTER the body prose (:109) and still INSIDE the left content column (its closing </div> follows at :121), i.e. before the FAQ accordion which lives in SEOContentSkeleton rendered after the grid (:142). Order: TOC -> short card -> body prose (ends with Disclaimer) -> detailed checklist -> FAQ. Correct.
- Rule 10 still strips the in-place body checklist: markdown-to-html.ts:233-235 loops COMPLIANCE_CHECKLIST_SECTION_SOURCES with global `gi` .replace over `cleaned`. Body prose is rendered from strippedBodyHtml (:109) so the in-place top copy is gone.
- SHARED matcher genuinely shared (no divergence): both strip (Rule 10) and extract iterate the SAME `COMPLIANCE_CHECKLIST_SECTION_SOURCES` array (markdown-to-html.ts:92-95). Sources stored as strings, compiled per-use (new RegExp) to avoid global-lastIndex bleakage between .replace(g) and .match() — correct and deliberate.
- Behavior verified empirically (node harness on representative HTML): extract returns the H2 "...Compliance Checklist" section incl ☐ items, STOPS before the next sibling H2 (Disclaimer), and strip removes exactly that section while keeping overview + disclaimer + their content. Last-section case (no trailing heading) also extracts/strips correctly via the `$` alternation.

== C. REQ 3 (overview de-dup) — PASS, present & intact ==
- Implemented in earlier branch commit 98ed155 ("remove duplicate overview teaser + clean TOC"). Verified intact on HEAD.
- No live hardcoded overview teaser: the old `<h2 id="overview">1. {overviewLabel}</h2>` + excerpt block is gone; body renders directly from strippedBodyHtml (:108-110). Remaining "overview"/"#overview" string hits in the file (lines 74-76, 101-104) are EXPLANATORY COMMENTS only, not JSX.
- TOC now mirrors body headings 1:1 with NO injected prefix and NO `#overview` entry: RegulationView.tsx:76-78 `contentHeadings.map((heading) => <li><a href={#id}>{heading.label}</a>)`. contentHeadings derived from strippedBodyHtml (:27) so anchors stay in sync (no orphan for the removed body checklist). No double-numbering.

== D. REGRESSION — PASS ==
- markdown-to-html.ts diff is PURELY ADDITIVE: `git diff main...HEAD` shows ZERO removed/changed lines in stripRedundantBodyBlocks' existing rules (only the new const block + new exported fn + new Rule 10 block). Therefore behavior for GuidePostClient, LeadGenTemplateClient, GlossaryTermPageClient, TaxView, glossary page, glossary.ts, content-pages.ts is byte-identical EXCEPT the net-new Rule 10.
- Net-new Rule 10 runs for ALL consumers, but is a safe no-op on non-regulation content: matcher requires literal "Compliance Checklist" inside an H2/H3 — verified extract("")/null/undefined -> "" and non-regulation body passes through unchanged (strip(other)===other). Only regulation bodies carry that section, so glossary/tax/guide output is unaffected.
- New symbols single-consumer: extractComplianceChecklistSection and NewsletterSidebar each have exactly one runtime consumer (RegulationView). No broader blast radius.

== E. CODE QUALITY — PASS ==
- Extraction logic lives in the canonical lib (markdown-to-html.ts), NOT inlined in the component — meets the stated implementation intent.
- No unused imports/vars: `Button` import removed from RegulationView (no longer referenced as a component; remaining "Button" text hits are a comment + a `ctaButtonText` prop name). All other imports referenced. ESLint EXIT 0 on all 3 files.
- tsc --noEmit EXIT 0. PortableTextContent accepts optional blocks (signature `{ blocks?, html? }` at PortableTextContent.tsx:71), so the html-only bottom render is type-valid.

== F. OTHER / EDGE CASES ==
- Empty/missing body checklist: extractComplianceChecklistSection returns "" (guarded `if (!html) return ""` + no-match fall-through), and the component guards `detailedChecklistHtml ? (...) : null` (:117) — no empty bordered box. Good.
- strip no-ops safely on non-regulation pages (verified). Good.
- COSMETIC ONLY (not blocking): the inline rule-number comments in stripRedundantBodyBlocks are non-sequential (…9,5,6,7,10,8). This ordering quirk PRE-EXISTS this PR; the new block is labeled "10" and sits before the existing "8". No functional impact (rules are independent regex passes). Suggest a future cleanup pass to renumber.
- Minor: the bottom detailed checklist renders the section's own H2 (e.g. "3. <NYC> Compliance Checklist") with its body-derived number prefix; since it's relocated below the Disclaimer the leading number may read slightly out-of-sequence visually. This matches the spec intent ("kept verbatim, like every live page") and is acceptable, but worth an eyeball on a live canary.

CONCLUSION: All three requirements implemented exactly; shared matcher is truly shared; refactor is additive with no regression to the other six+ consumers; tsc + eslint clean. APPROVED. Recommend a live canary on one regulation page to eyeball the relocated checklist numbering before bulk.
