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
 */
export function stripRedundantBodyBlocks(html: string | undefined | null): string {
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

  return cleaned;
}
