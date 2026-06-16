VERDICT: APPROVED

Layer-4 fresh-context review of increment 0837357..c618e4c (commit c618e4c) on
branch fix/regulations-single-checklist. Verified against actual code, not prior
claims. tsc clean, all functional assertions confirmed.

================================================================================
REFINEMENT 1 — uniform checkbox sizes
================================================================================
PASS. src/components/content/views/RegulationView.tsx:104
  <input type="checkbox" className="h-6 w-6 shrink-0 mt-0.5 rounded border-primary
   text-primary focus:ring-primary" />
- `shrink-0` is present on the interactive checklist card's checkbox input, which
  sits inside a `flex items-start gap-4` row (line 102). shrink-0 prevents the
  fixed h-6 w-6 box from being compressed when the sibling <label> wraps. Correct
  fix for the squish.
- Nothing else regressed: the diff for this line changes only the className
  (adds `shrink-0`), markup and the checklistItems.length>0 gate unchanged.

================================================================================
REFINEMENT 2 — relocated bottom checklist appears in the TOC
================================================================================

2a. headingId EXPORTED — PASS.
  src/components/content/PortableTextContent.tsx:8  `export function headingId(...)`
  - Only change in this file vs main is the added `export` keyword (verified via
    `diff main HEAD` — the rest of the file, including the image-render `any`
    block, is byte-identical to main).
  - Still used internally without breakage: line 58 (h2 id), line 113
    (portableTextHeadings blocks path), line 125 (portableTextHeadings html path).
    Additive change, zero behavior delta.

2b. firstHeadingText — PASS (correct + safe).
  src/lib/markdown-to-html.ts:103-107
    if (!html) return "";
    const m = html.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
    return m ? m[1].replace(/<[^>]+>/g, "").trim() : "";
  - Returns "" on undefined/null/"" (guard) and on no-heading input. Verified by
    executing the function against 7 cases:
      empty/undefined/null/no-heading -> ""   (all guarded)
      <h2><strong>Airbnb Compliance Checklist</strong></h2> -> "Airbnb Compliance Checklist"
      <h3 id="x">  Short-Term Rental Checklist  </h3> -> "Short-Term Rental Checklist"
  - Inner tags (incl. <strong>) are stripped via .replace(/<[^>]+>/g,"") then
    trimmed, so the slug is clean. Matches first H2 OR H3, attributes tolerated.

2c. RegulationView wiring — PASS (anchor id MATCHES wrapper id; guarded).
  RegulationView.tsx:30  detailedChecklistHeading = firstHeadingText(detailedChecklistHtml)
  RegulationView.tsx:31  detailedChecklistId = detailedChecklistHeading ? headingId(detailedChecklistHeading) : ""
  RegulationView.tsx:87-89  TOC <li>: {detailedChecklistHeading ? <li><a href={`#${detailedChecklistId}`}>{detailedChecklistHeading}</a></li> : null}
  RegulationView.tsx:128 wrapper: <div id={detailedChecklistId || undefined} ... scroll-mt-24>
  - The TOC anchor (`#${detailedChecklistId}`) and the wrapper `id` reference the
    SAME variable detailedChecklistId -> the link will actually scroll to the
    section. scroll-mt-24 added so the sticky header does not cover it.
  - Empty-state guarded both ways:
      * TOC <li> renders only when detailedChecklistHeading is truthy;
        detailedChecklistHeading is non-empty only when detailedChecklistHtml has
        an H2/H3, which only happens when extractComplianceChecklistSection found
        a section -> i.e. detailedChecklistHtml !== "". So TOC entry and wrapper
        (gated on detailedChecklistHtml, line 127) appear/disappear together.
      * `id={detailedChecklistId || undefined}` -> no empty `id=""` is ever
        emitted on the wrapper div.

================================================================================
ALSO CHECKED
================================================================================
A. Regression / consumers — PASS.
   - grep firstHeadingText across src/: one definition (markdown-to-html.ts:103)
     + one consumer (RegulationView.tsx:30, import at :6). No other consumer.
   - grep headingId importers: RegulationView.tsx imports from PortableTextContent
     (the canonical one). NOTE a SECOND, identical headingId exists in
     src/lib/content-helpers.ts:56 (byte-identical impl) — pre-existing, untouched
     by this PR, not imported by RegulationView; no conflict.
   - stripRedundantBodyBlocks: NOT in this increment's diff (unchanged).
     extractComplianceChecklistSection: appears in the diff only because the new
     firstHeadingText JSDoc was inserted immediately above it; the function BODY
     is unchanged (verified by reading the hunk).

B. No inline slugger — PASS.
   RegulationView computes the slug via the imported canonical headingId
   (line 31), not a re-implemented normalizer. Confirmed.

C. tsc — PASS. `npx tsc --noEmit` exits 0 (no errors).
   eslint: the 4 @typescript-eslint/no-explicit-any errors in
   PortableTextContent.tsx (image-render `(block as any)` at lines ~46-48) are
   PRE-EXISTING — `diff main HEAD` shows the only change to that file is the
   `export` keyword on headingId; the any-block is byte-identical to main.
   Not introduced by this PR.

D. Edge cases —
   - <strong>-wrapped heading: firstHeadingText strips inner tags, so
     "<h2><strong>Airbnb Compliance Checklist</strong></h2>" ->
     "Airbnb Compliance Checklist" -> slug "airbnb-compliance-checklist". Clean. OK.
   - HTML entities: "<h2>A &amp; B Checklist</h2>" yields label "A &amp; B
     Checklist" (entity not decoded) -> slug "a-amp-b-checklist". Cosmetic only
     (the raw entity reaches the label); acceptable, not a correctness bug, and no
     compliance-checklist heading realistically contains an entity. Non-blocking.
   - DUPLICATE-ID RISK (non-blocking note): RegulationView body renders via
     <PortableTextContent blocks={regulation.body} ...> (line 119). stripRedundant
     BodyBlocks removes the checklist H2 from the HTML string only, NOT from the
     `blocks` array. IF regulation.body were a populated PortableText array
     containing the checklist H2, the body would render that H2 with
     id={headingId(text)} == detailedChecklistId (duplicate id with the bottom
     wrapper) and portableTextHeadings' blocks path would emit a duplicate TOC
     <li>. HOWEVER this cannot occur on the live content shape: regulations are
     built with body: [] (content-pages.ts:46/92/184/267) in the Supabase-first
     flow, so PortableTextContent always falls through to the HTML path driven by
     strippedBodyHtml (checklist H2 removed) for BOTH the body and the TOC. The
     blocks path is dormant for regulations. This is a pre-existing architectural
     property, not introduced by this increment, and not triggerable by deployed
     content. Flagged for awareness only.
   - Cosmetic: the new firstHeadingText JSDoc (markdown-to-html.ts:100-102) is
     stacked directly above extractComplianceChecklistSection's own JSDoc
     (:99-100 belongs to the latter, now visually attached to firstHeadingText).
     Harmless misplacement; recommend (not required) moving firstHeadingText's
     JSDoc to sit with its function or separating the blocks.

================================================================================
CONCLUSION: Both refinements are correct and live-path-safe. Anchor id matches
wrapper id; empty-state fully guarded (no TOC entry, no empty id); shrink-0 fixes
the squish; headingId export is additive and the canonical slugger is reused (no
re-implementation); firstHeadingText is correct and null-safe with a single
consumer; tsc clean; the 4 eslint any-errors are pre-existing and untouched.
Two non-blocking notes (theoretical duplicate-id in the dormant blocks path;
cosmetic JSDoc placement). APPROVED.
