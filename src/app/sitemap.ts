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
    .select('custom_slug, updated_at, published_at')
    .eq('client_id', clientId)
    .eq('writing_status', 'published')
    .not('content_body', 'is', null)
    .order('published_at', { ascending: false });

  if (error || !data) return staticEntries;

  const contentEntries: MetadataRoute.Sitemap = data
    .filter((piece: any) => piece.custom_slug && !isTestContent(piece.custom_slug))
    .map((piece: any) => ({
      url: toAbsoluteUrl(buildPath(piece.custom_slug)),
      lastModified: piece.updated_at ? new Date(piece.updated_at) : piece.published_at ? new Date(piece.published_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  // Deduplicate
  const seen = new Set<string>();
  const deduped = contentEntries.filter((entry) => {
    const normalized = entry.url.toLowerCase().replace(/\/+$/, '');
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });

  return [...staticEntries, ...deduped];
}
