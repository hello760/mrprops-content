// Canonical allow-list + normaliser for newsletter signup `source` attribution.
// Single source of truth consumed by /api/newsletter/subscribe. Every value here
// MUST match a `source=` prop passed to <NewsletterCTA/> / <NewsletterSidebar/>;
// an unknown or non-string source falls back to 'footer'.
export const VALID_NEWSLETTER_SOURCES = new Set<string>([
  'footer', 'guides_cta', 'tools_cta', 'regulations_cta', 'regulations_sidebar', 'taxes_cta',
  'glossary_cta', 'templates_cta', 'alternatives_cta', 'compare_cta', 'manual',
]);

export function normalizeNewsletterSource(raw: unknown): string {
  return typeof raw === 'string' && VALID_NEWSLETTER_SOURCES.has(raw) ? raw : 'footer';
}
