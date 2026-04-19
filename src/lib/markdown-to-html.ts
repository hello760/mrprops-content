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
