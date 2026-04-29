import type { MetadataRoute } from "next";
import { getSupabase } from "@/lib/supabase";

export const revalidate = 3600;

const BASE_URL = "https://mrprops.io";

const STATIC_PAGES: Array<{ path: string; priority: number }> = [
  { path: "/", priority: 1 },
  { path: "/pricing", priority: 0.6 },
  { path: "/glossary", priority: 0.6 },
  { path: "/guides", priority: 0.6 },
  { path: "/alternatives", priority: 0.6 },
  { path: "/compare", priority: 0.6 },
  { path: "/regulations", priority: 0.6 },
  { path: "/taxes", priority: 0.6 },
  { path: "/templates", priority: 0.6 },
  { path: "/tools", priority: 0.6 },
];

/**
 * Categories with statically pre-rendered /tools/[category] pages.
 * Built dynamically from the data below — see derivation block.
 */

function toAbsoluteUrl(path: string) {
  return `${BASE_URL}${path}`;
}

/** custom_slug in Supabase already includes the full path prefix */
function buildPath(customSlug: string): string {
  return customSlug.startsWith("/") ? customSlug : `/${customSlug}`;
}

/** Filter out test/garbage content */
function isTestContent(slug: string): boolean {
  if (/-\d{8,}/.test(slug)) return true;
  if (/\/guides\/post-\d+$/.test(slug)) return true;
  if (/\/guides\/post-featured$/.test(slug)) return true;
  return false;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = getSupabase();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: toAbsoluteUrl(page.path),
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: page.priority,
  }));

  if (!sb) return staticEntries;

  const clientId = process.env.MR_PROPS_CLIENT_ID || '';
  if (!clientId) return staticEntries;

  const { data, error } = await sb
    .from('content_pieces')
    .select('custom_slug, live_url, updated_at, published_at')
    .eq('client_id', clientId)
    .eq('writing_status', 'published')
    .not('content_body', 'is', null)
    .order('published_at', { ascending: false });

  if (error || !data) return staticEntries;

  const contentEntries: MetadataRoute.Sitemap = [];
  for (const piece of data as Array<Record<string, any>>) {
    if (!piece.custom_slug || isTestContent(piece.custom_slug)) continue;
    // Prefer live_url (canonical, includes path prefix). Fall back to deriving
    // from custom_slug only when slug includes a path segment.
    // Skip pieces whose custom_slug is a bare token (no '/') AND no live_url —
    // those produce orphan top-level URLs that 404 (audit 2026-04-29).
    let url: string | null = null;
    if (typeof piece.live_url === 'string' && piece.live_url.startsWith('http')) {
      url = piece.live_url;
    } else if ((piece.custom_slug as string).includes('/')) {
      url = toAbsoluteUrl(buildPath(piece.custom_slug));
    }
    if (!url) continue;
    contentEntries.push({
      url,
      lastModified: piece.updated_at ? new Date(piece.updated_at) : piece.published_at ? new Date(piece.published_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Derive category-level entries for /tools/[category] pages from live tool slugs.
  const toolCategories = new Set<string>();
  for (const piece of data) {
    const slug = piece.custom_slug as string;
    if (slug && slug.startsWith('tools/')) {
      const parts = slug.split('/');
      if (parts.length >= 3 && parts[1]) toolCategories.add(parts[1]);
    }
  }
  const categoryEntries: MetadataRoute.Sitemap = Array.from(toolCategories).map((cat) => ({
    url: toAbsoluteUrl(`/tools/${cat}`),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // Deduplicate
  const seen = new Set<string>();
  const deduped = [...contentEntries, ...categoryEntries].filter((entry) => {
    const normalized = entry.url.toLowerCase().replace(/\/+$/, '');
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });

  return [...staticEntries, ...deduped];
}
