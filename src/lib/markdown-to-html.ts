/**
 * FIX-020 (PF-20, PF-29): Minimal markdown→HTML transform for content_body
 * piped through dangerouslySetInnerHTML.
 *
 * Generator sometimes emits markdown bold (`**text**`) inside `<p>` elements
 * instead of proper `<strong>` tags. Without this transform those asterisks
 * render literally to users (confirmed on tax + regulation live pages — 6+
 * and 11+ instances respectively).
 *
 * Scope: intentionally narrow. We only convert bold/italic markdown INSIDE
 * existing HTML tags (the body is already HTML; we're cleaning leaked markdown
 * tokens, not converting full markdown documents). Headings, lists, links,
 * images are already HTML — we don't touch them.
 *
 * Why not `marked`? Adding a full markdown parser is ~50KB gzipped and would
 * process the already-HTML body, potentially re-HTML-escaping tags. This
 * targeted regex transform is ~500 bytes and safe for the actual pattern we
 * see leaking.
 */
export function markdownToHtml(html: string | undefined | null): string {
  if (!html) return "";
  return html
    // **bold** → <strong>bold</strong>
    // Pattern: double-asterisk, capture non-greedy non-asterisk content, double-asterisk
    // Avoid matching across line breaks so we don't eat paragraphs by accident.
    .replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>")
    // *italic* → <em>italic</em> — single asterisk, but avoid matching the **bold** we just transformed
    // and avoid matching single * as a list marker (which appears at start of line after whitespace)
    .replace(/(?<![\w*])\*([^*\n]+?)\*(?![\w*])/g, "<em>$1</em>");
}

/**
 * FIX-017 (PF-17, multi-FAQ) + FIX-021 (PF-21 byline inside bodyHtml):
 *
 * Strip redundant blocks from content_body before rendering. The generator
 * sometimes embeds:
 *   1. Inline FAQ sections — <h2|h3>Frequently Asked Questions</h2> + a
 *      <section> or a series of <div class="faq-item"> — while structured_data.faqs
 *      also renders below as an accordion. Remove the inline FAQ so the accordion is
 *      the sole FAQ block per PDF global rules.
 *   2. Author byline div — <div class="author-meta">...<span class="author-name">...
 *      Editorial Team...</span>...</div> — already hidden at the View level but the
 *      same block persists inside bodyHtml. Remove it here so it doesn't render via
 *      dangerouslySetInnerHTML.
 *   3. "Last Updated" / "Reviewed by" inline labels inside bodyHtml that slip past
 *      the View-level removal (for any future pieces whose generator emits them).
 *
 * This is a surgical runtime scrub, not a generator-level fix. The generator should
 * also be updated (separate commit) to not emit these blocks — but doing it here
 * first closes the user-facing bug immediately without touching generation.
 *
 * 2026-05-22 (P1 — Helvis screenshots 2026-05-21):
 *   Added Rules 6, 7, 8, 9 to close 4 new template-family duplications between
 *   the body LLM's emitted HTML and the structured_data widgets rendered by
 *   `LeadGenTemplateClient.tsx:96-231`. Mirrors the proven Rule 5 pattern
 *   (Best Practices, live since 2026-05-04, zero regressions). Cross-family
 *   collision check 2026-05-22: zero non-template Mr Props pieces have H2
 *   "Trust Signals" or "Common Mistakes to Avoid" or class
 *   `template-hero-widget` in body — safe to apply globally.
 *
 *   Rule 9 (briefClosing) is opt-in via the `briefClosingTitle` option because
 *   the Conclusion-section heading varies per piece (per the LLM prompt at
 *   `mmg-wrk/src/lib/family-modifiers-mrprops.ts:219` — "Short declarative
 *   title summarizing the core value proposition (NOT 'Conclusion')").
 */
export interface StripRedundantBodyBlocksOptions {
  /** Pass `sd.briefClosing.title` from the template piece. When provided AND
   *  the briefClosing widget is rendering (the renderer gates on the title +
   *  body both being present), Rule 9 strips the body's duplicate Conclusion
   *  section. Two strategies:
   *    (a) Title-match: H2 whose text equals the title or shares ≥3 substantial
   *        (≥4-char) words with the title is stripped.
   *    (b) Positional fallback: if title-match misses, the LAST H2 between
   *        the "Common Mistakes to Avoid"/"Best Practices for Implementation"
   *        anchor and the FAQ section / </article> is the LLM-prompted
   *        Conclusion slot — strip it.
   *  No-op when not provided. */
  briefClosingTitle?: string;
}

/**
 * The body's "…Compliance Checklist" section — an H2/H3 whose text contains
 * "Compliance Checklist" (sometimes wrapped in <strong>), plus everything up to
 * the next sibling heading. Shared by two paths so the matcher never diverges:
 *   - stripRedundantBodyBlocks (Rule 10) REMOVES it from the in-place body, so
 *     the detailed checklist does not render at the top.
 *   - extractComplianceChecklistSection RETURNS it so a caller can render it
 *     elsewhere. On /regulations, RegulationView.tsx renders it at the BOTTOM
 *     (after the Disclaimer, before the FAQ); the short interactive
 *     structured_data checklist card stays near the top.
 * Stored as source strings and compiled per use to avoid shared-lastIndex bugs
 * between the global .replace() (strip) and single .match() (extract) paths.
 */
const COMPLIANCE_CHECKLIST_SECTION_SOURCES = [
  String.raw`<h2[^>]*>(?:(?!</h2>)[\s\S])*?Compliance Checklist(?:(?!</h2>)[\s\S])*?</h2>[\s\S]*?(?=<h2|</section|</article|</main|$)`,
  String.raw`<h3[^>]*>(?:(?!</h3>)[\s\S])*?Compliance Checklist(?:(?!</h3>)[\s\S])*?</h3>[\s\S]*?(?=<h2|<h3|</section|</article|</main|$)`,
];

/** Return the body's "…Compliance Checklist" section HTML (H2/H3 + items), or
 *  "" if none. Used to relocate the detailed checklist to the page bottom. */
/** Plain-text of the first H2/H3 heading in an HTML fragment (inner tags
 *  stripped), or "" if none. Used to label/anchor the relocated checklist. */
export function firstHeadingText(html: string | undefined | null): string {
  if (!html) return "";
  const m = html.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
  return m ? m[1].replace(/<[^>]+>/g, "").trim() : "";
}

export function extractComplianceChecklistSection(html: string | undefined | null): string {
  if (!html) return "";
  for (const src of COMPLIANCE_CHECKLIST_SECTION_SOURCES) {
    const m = html.match(new RegExp(src, "i"));
    if (m) return m[0];
  }
  return "";
}

export function stripRedundantBodyBlocks(
  html: string | undefined | null,
  options?: StripRedundantBodyBlocksOptions,
): string {
  if (!html) return "";
  let cleaned = html;

  // 1a. Strip <section>/<div> that CONTAINS an <h2|h3>Frequently Asked Questions</h2>
  //     Match non-greedy across lines, cut at closing </section> or </div>.
  cleaned = cleaned.replace(
    /<section[^>]*>\s*<h2[^>]*>\s*[^<]*Frequently Asked Questions[^<]*<\/h2>[\s\S]*?<\/section>/gi,
    ""
  );
  // 1b. Strip bare inline H2 "Frequently Asked Questions" and any sibling faq-item divs
  //     that follow until the next H2. Less aggressive than 1a.
  cleaned = cleaned.replace(
    /<h2[^>]*>\s*[^<]*Frequently Asked Questions[^<]*<\/h2>[\s\S]*?(?=<h2|<\/article|<\/main|$)/gi,
    ""
  );
  // 1c. Remove stray <div class="faq-item">... wrappers even if the h2 is gone.
  cleaned = cleaned.replace(
    /<div class="faq-item">[\s\S]*?<\/div>/gi,
    ""
  );

  // 2. Strip the author-meta byline block.
  cleaned = cleaned.replace(
    /<div class="author-meta">[\s\S]*?<\/div>/gi,
    ""
  );

  // 3. Strip inline paragraphs that only contain "Last Updated: …" or "Reviewed by: …"
  cleaned = cleaned.replace(
    /<p[^>]*>\s*(Last Updated|Reviewed by)[^<]{0,100}<\/p>/gi,
    ""
  );

  // 4. Strip <h1> tags from bodyHtml — every page renderer already provides an H1 via
  //    structured fields (hero title, seoTitle, etc.). H1s embedded in content_body
  //    duplicate that and confuse both users and accessibility tools. Found today on
  //    tax (2 H1s), regulation (2), guide (3), calculator (2). Demote to <p class="sr-only">
  //    to preserve any anchor ids? No — just remove entirely. If downstream code wants the
  //    title it should read structured_data.title.
  cleaned = cleaned.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, "");

  // 9. Strip body's "Conclusion" H2 + content (the LLM-prompted closing
  //    section per family-modifiers-mrprops.ts:219). Renderer's briefClosing
  //    widget at `LeadGenTemplateClient.tsx:226-231` renders the same intent
  //    from sd.briefClosing.{title,body}. Title varies per piece, so this
  //    rule is opt-in via options.briefClosingTitle.
  //
  //    Strategy: pass 1 = title-match (exact case-insensitive OR ≥3 substantial
  //    shared words); pass 2 = positional fallback if no title-match fired
  //    (LLM prompt structure guarantees the Conclusion appears AFTER "Common
  //    Mistakes to Avoid" or "Best Practices for Implementation" anchor and
  //    BEFORE the FAQ section/end-of-article).
  //
  //    IMPORTANT: Rule 9 runs BEFORE Rules 5/8 because the positional fallback
  //    uses those H2s as anchors — stripping them first leaves Rule 9 unable
  //    to locate the Conclusion slot. Each rule operates on the running
  //    `cleaned` value but the order is deliberate. Verified 2026-05-22 on
  //    pet-policy-template where the body's "Conclusion — Why Every Business
  //    Needs a Pet Policy" wasn't being stripped because Rule 5 had already
  //    removed the Best Practices anchor.
  const briefClosingTitle = (options?.briefClosingTitle || "").trim();
  if (briefClosingTitle) {
    cleaned = stripBriefClosingDuplicate(cleaned, briefClosingTitle);
  }

  // 5. Strip body H2 "Best Practices for Implementation" + section content
  //    (until next H2 or end of body). The template wrapper (LeadGenTemplateClient
  //    line 194) hardcodes `<h2>Best Practices for Implementation</h2>` followed
  //    by an ordered list rendered from structured_data.bestPractices. Body LLM
  //    also emits this H2 + its bullet items, producing duplicate H2 + duplicate
  //    items. Stripping from body keeps the wrapper as the single source of
  //    truth for that section. Cross-family audit 2026-05-04 confirmed this
  //    duplicate on /templates/general/property-management-termination-letter-template
  //    and /templates/general/free-property-management-plan-template (3932-char
  //    span between the two occurrences).
  cleaned = cleaned.replace(
    /<h2[^>]*>\s*[^<]*Best Practices for Implementation[^<]*<\/h2>[\s\S]*?(?=<h2|<\/article|<\/main|$)/gi,
    ""
  );

  // 6. Strip body's `<section class="template-hero-widget">…</section>` block.
  //    The renderer at `LeadGenTemplateClient.tsx:96-160` renders a styled
  //    gate widget (badge + preview title/meta + email gate + disclaimer)
  //    from sd.{badge,previewTitle,previewMeta,gateTitle,gateDescription,
  //    formPlaceholder,formButtonLabel,formDisclaimer,templateFile}. The
  //    body LLM also emits an equivalent <section class="template-hero-widget">
  //    via the family-modifiers-mrprops.ts prompt, producing two gate UIs
  //    stacked. Class-based strip is safe — DB cross-family scan 2026-05-22:
  //    0 non-template Mr Props pieces contain this class.
  cleaned = cleaned.replace(
    /<section\b[^>]*class="[^"]*\btemplate-hero-widget\b[^"]*"[^>]*>[\s\S]*?<\/section>/gi,
    ""
  );

  // 7. Strip `<h2>Trust Signals</h2>` + its content. The renderer at
  //    `LeadGenTemplateClient.tsx:101-105` renders trust pills from
  //    sd.trustItems[]. The body LLM emits a Trust Signals H2 + 3 paragraphs
  //    (often wrapped in a plain `<section>`). Two-stage strip:
  //      7a. Wrapped form: `<section>\s*<h2>Trust Signals</h2>…</section>`
  //      7b. Bare form: `<h2>Trust Signals</h2>…(?=next H2 boundary)` (Rule 5 shape)
  //    DB cross-family scan 2026-05-22: 0 non-template Mr Props pieces have
  //    H2 "Trust Signals" — paragraph mentions of "trust signals" don't match
  //    the H2-only regex.
  cleaned = cleaned.replace(
    /<section\b[^>]*>\s*<h2[^>]*>\s*[^<]*Trust Signals[^<]*<\/h2>[\s\S]*?<\/section>/gi,
    ""
  );
  cleaned = cleaned.replace(
    /<h2[^>]*>\s*[^<]*Trust Signals[^<]*<\/h2>[\s\S]*?(?=<h2|<\/section|<\/article|<\/main|$)/gi,
    ""
  );

  // 10. Remove the body's "…Compliance Checklist" section from the IN-PLACE body.
  //     On /regulations BOTH checklists are kept but repositioned: the detailed
  //     body checklist is relocated to the BOTTOM (after the Disclaimer, before
  //     the FAQ) by RegulationView via extractComplianceChecklistSection(), and
  //     the short interactive structured_data card sits near the top. Stripping
  //     the section here prevents the detailed list from ALSO rendering at the
  //     top of the body. Same matcher as the extractor (shared sources), so the
  //     two never diverge. The structured card is rendered OUTSIDE bodyHtml, so
  //     it is never matched here.
  for (const src of COMPLIANCE_CHECKLIST_SECTION_SOURCES) {
    cleaned = cleaned.replace(new RegExp(src, "gi"), "");
  }

  // 8. Strip `<h2>Common Mistakes to Avoid</h2>` + its content. The renderer
  //    at `LeadGenTemplateClient.tsx:204-223` renders the 2-column Do/Don't
  //    card from sd.commonMistakes.{doList,dontList}. Body LLM emits the
  //    same content as bullets under an H2. Same Rule 5 shape — strip until
  //    next H2/section/article boundary. (See order note above Rule 9.)
  cleaned = cleaned.replace(
    /<h2[^>]*>\s*[^<]*Common Mistakes to Avoid[^<]*<\/h2>[\s\S]*?(?=<h2|<\/section|<\/article|<\/main|$)/gi,
    ""
  );

  return cleaned;
}

/**
 * Helper — internal to markdown-to-html.ts. Strips the body's Conclusion H2
 * that duplicates the structured_data.briefClosing widget. Three passes:
 *
 *   1. Title-match: H2 whose text exactly equals (case-insensitive trim) OR
 *      shares ≥3 substantial (≥4-char) words with `briefClosingTitle`.
 *   2. Keyword-match: H2 whose text contains classic LLM-closing keywords
 *      ("Conclusion", "Final Thoughts", "Bottom Line", "In Closing", "Wrap
 *      Up", "Closing Thoughts", "Key Takeaways", "Summary"). Catches body
 *      pieces where the LLM ignored the "NOT 'Conclusion'" instruction in
 *      family-modifiers-mrprops.ts:219.
 *   3. Positional fallback: a single H2 between the "Common Mistakes to
 *      Avoid" / "Best Practices for Implementation" anchor and the FAQ
 *      section / </article>. Per family-modifiers-mrprops.ts:219, the LLM
 *      emits a Conclusion in that slot when those anchors exist.
 *
 * Returns cleaned HTML. Never throws. Single-strip semantics — only one H2
 * is removed per call, even if multiple match (the FIRST one). The runtime
 * widget's H2 (rendered separately by LeadGenTemplateClient.tsx:226-231)
 * is OUTSIDE the bodyHtml input, so it's never matched here.
 */
const CONCLUSION_KEYWORDS = [
  "conclusion",
  "final thoughts",
  "bottom line",
  "in closing",
  "wrap up",
  "wrapping up",
  "closing thoughts",
  "key takeaways",
  "in summary",
];

function stripBriefClosingDuplicate(html: string, briefClosingTitle: string): string {
  const titleNorm = briefClosingTitle.trim().toLowerCase();
  const titleWords = new Set(
    Array.from(briefClosingTitle.matchAll(/\w{4,}/g), (m) => m[0].toLowerCase()),
  );

  // Enumerate H2s
  const h2Re = /<h2[^>]*>([^<]*)<\/h2>/gi;
  const matches: Array<{ start: number; end: number; text: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = h2Re.exec(html)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, text: m[1] });
  }

  let stripTargetIdx = -1;

  // Pass 1: title-match
  for (let i = 0; i < matches.length; i++) {
    const text = matches[i].text.trim();
    if (text.toLowerCase() === titleNorm) {
      stripTargetIdx = i;
      break;
    }
    const tWords = new Set(
      Array.from(text.matchAll(/\w{4,}/g), (mm) => mm[0].toLowerCase()),
    );
    let shared = 0;
    for (const w of titleWords) if (tWords.has(w)) shared++;
    if (shared >= 3 && titleWords.size > 0) {
      stripTargetIdx = i;
      break;
    }
  }

  // Pass 2: keyword-match — only check H2s in the bottom half of the body
  // (closing sections are always near the end). Avoids false positives on
  // intro H2s like "In Summary of the Problem" appearing early.
  if (stripTargetIdx === -1) {
    const halfwayMark = Math.floor(html.length / 2);
    for (let i = 0; i < matches.length; i++) {
      if (matches[i].start < halfwayMark) continue;
      const lower = matches[i].text.toLowerCase();
      if (CONCLUSION_KEYWORDS.some((kw) => lower.includes(kw))) {
        stripTargetIdx = i;
        break;
      }
    }
  }

  // Pass 3: positional fallback
  if (stripTargetIdx === -1) {
    const anchorRe =
      /<h2[^>]*>\s*[^<]*(?:Common Mistakes to Avoid|Best Practices for Implementation)[^<]*<\/h2>/gi;
    let lastAnchor: RegExpExecArray | null = null;
    let am: RegExpExecArray | null;
    while ((am = anchorRe.exec(html)) !== null) lastAnchor = am;
    if (lastAnchor) {
      const anchorEnd = lastAnchor.index + lastAnchor[0].length;
      const endRe =
        /<section[^>]*id=["']faq["']|<h2[^>]*>\s*[^<]*Frequently Asked Questions[^<]*<\/h2>|<\/article|<\/main/i;
      const endMatch = endRe.exec(html.slice(anchorEnd));
      const endIdx = endMatch ? anchorEnd + endMatch.index : html.length;
      for (let i = 0; i < matches.length; i++) {
        if (matches[i].start > anchorEnd && matches[i].start < endIdx) {
          stripTargetIdx = i;
          break;
        }
      }
    }
  }

  if (stripTargetIdx === -1) return html;

  // Strip from H2 start up to next H2 / section / article boundary.
  const target = matches[stripTargetIdx];
  const tail = html.slice(target.start);
  const boundaryRe = /<h2[^>]*>|<\/section|<\/article|<\/main/i;
  const boundaryMatch = boundaryRe.exec(tail.slice(target.end - target.start));
  const endOffset = boundaryMatch
    ? target.end - target.start + boundaryMatch.index
    : tail.length;
  return html.slice(0, target.start) + tail.slice(endOffset);
}
