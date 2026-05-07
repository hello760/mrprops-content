import type { Metadata } from "next";

const DEFAULT_OG_IMAGE = "/og-image.png";

/**
 * Build a Next.js Metadata object with full OG + Twitter card coverage.
 *
 * Per Helvis 2026-05-07: every page must surface an og:image so that URLs
 * pasted into Slack / LinkedIn / Twitter / iMessage render with a preview
 * thumbnail. The image source mirrors the visible page hero —
 * sd.featuredImage when the page has one, otherwise the brand fallback at
 * /og-image.png.
 *
 * @param title Visible SEO title (the layout template appends " | Mr. Props")
 * @param description Meta description shared across SEO + OG + Twitter
 * @param path Canonical path (with or without leading "/")
 * @param image Absolute or root-relative URL of the per-page hero image.
 *   Falls back to /og-image.png when omitted, null, or empty.
 */
export function buildMetadata(
  title: string,
  description: string,
  path: string,
  image?: string | null,
): Metadata {
  const canonical = path.startsWith("/") ? path : `/${path}`;
  // Strip existing "| Mr. Props" suffix to prevent double append from layout template
  const cleanTitle = title.replace(/\s*\|\s*Mr\.?\s*Props\s*$/i, '').trim();

  // Resolve OG image. Null/undefined/empty → brand fallback.
  // Accepts absolute URLs (Supabase storage CDN) and root-relative paths.
  const ogImageUrl = (typeof image === 'string' && image.trim().length > 0)
    ? image.trim()
    : DEFAULT_OG_IMAGE;
  const ogImages = [{ url: ogImageUrl, width: 1200, height: 630, alt: cleanTitle || 'Mr. Props' }];

  return {
    title: cleanTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      siteName: "Mr. Props",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}
