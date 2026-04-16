import type { MetadataRoute } from "next";
import { sanityFetch } from "@/lib/sanity";
import { getSupabase } from "@/lib/supabase";

export const revalidate = 3600; // Regenerate sitemap every hour

const BASE_URL = "https://mrprops.io";

type SitemapDoc = {
  _type: string;
  _updatedAt?: string;
  pageType?: "features" | "services";
  slug?: { current?: string };
};

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

function stripPrefix(value: string, prefix: string) {
  return value.replace(new RegExp(`^${prefix}/?`), "").replace(/^\/+/, "");
}

function toAbsoluteUrl(path: string) {
  return `${BASE_URL}${path}`;
}

// ─── Sanity slug → path (legacy fallback) ────────────────────────────────────

function buildContentPathFromSanity(doc: SitemapDoc) {
  const rawSlug = doc.slug?.current;
  if (!rawSlug) return null;

  switch (doc._type) {
    case "glossaryTerm":
      return `/glossary/${stripPrefix(rawSlug, "glossary")}`;
    case "guide":
      return `/guides/${stripPrefix(rawSlug, "guides")}`;
    case "landingPage": {
      const pageType = doc.pageType || (rawSlug.startsWith("services/") ? "services" : "features");
      return `/${pageType}/${stripPrefix(rawSlug, pageType)}`;
    }
    case "comparisonPage":
      return `/compare/${stripPrefix(rawSlug, "compare")}`;
    case "alternativePage":
      return `/alternatives/${stripPrefix(rawSlug, "alternatives")}`;
    case "regulationPage": {
      // Ensure proper /regulations/platform/location path
      if (rawSlug.startsWith("regulations/")) return `/${rawSlug}`;
      return `/regulations/${rawSlug}`;
    }
    case "taxPage": {
      // Ensure proper /taxes/platform/region path
      if (rawSlug.startsWith("taxes/")) return `/${rawSlug}`;
      return `/taxes/${rawSlug}`;
    }
    case "leadGenTemplatePage": {
      // Ensure proper /templates/category/slug path
      if (rawSlug.startsWith("templates/")) return `/${rawSlug}`;
      return `/templates/template/${rawSlug}`;
    }
    case "calculatorToolPage": {
      // Ensure proper /tools/category/slug path
      if (rawSlug.startsWith("tools/")) return `/${rawSlug}`;
      return `/tools/operations/${rawSlug}`;
    }
    default:
      return null;
  }
}

// ─── Supabase custom_slug → path (primary) ──────────────────────────────────

/** custom_slug in Supabase already includes the full path prefix, e.g. "compare/guesty-vs-lodgify" */
function buildContentPathFromSupabase(customSlug: string): string {
  return customSlug.startsWith("/") ? customSlug : `/${customSlug}`;
}

/** Filter out test/garbage content that shouldn't be in the sitemap */
function isTestContent(url: string): boolean {
  // Filter out test duplicates with numeric suffix (e.g., -1775749911)
  if (/-\d{8,}/.test(url)) return true;
  // Filter out placeholder posts (post-0, post-1, etc.)
  if (/\/guides\/post-\d+$/.test(url)) return true;
  if (/\/guides\/post-featured$/.test(url)) return true;
  return false;
}

// ─── Fetch from Supabase ─────────────────────────────────────────────────────

async function fetchSupabaseSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const sb = getSupabase();
  if (!sb) return [];

  const clientId = process.env.MR_PROPS_CLIENT_ID || '';
  if (!clientId) return [];

  const { data, error } = await sb
    .from('content_pieces')
    .select('custom_slug, updated_at, published_at')
    .eq('client_id', clientId)
    .eq('writing_status', 'published')
    .not('content_body', 'is', null)
    .order('published_at', { ascending: false });

  if (error || !data) return [];

  return data
    .filter((piece: any) => piece.custom_slug)
    .map((piece: any) => ({
      url: toAbsoluteUrl(buildContentPathFromSupabase(piece.custom_slug)),
      lastModified: piece.updated_at ? new Date(piece.updated_at) : piece.published_at ? new Date(piece.published_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
}

// ─── Fetch from Sanity (fallback for unmigrated content) ─────────────────────

async function fetchSanitySitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const docs = await sanityFetch<SitemapDoc[]>(`
      *[_type in [
        "glossaryTerm",
        "guide",
        "landingPage",
        "comparisonPage",
        "alternativePage",
        "regulationPage",
        "taxPage",
        "leadGenTemplatePage",
        "calculatorToolPage"
      ] && defined(slug.current)]{
        _type,
        _updatedAt,
        pageType,
        slug
      }
    `);

    return docs.reduce<MetadataRoute.Sitemap>((entries, doc) => {
      const path = buildContentPathFromSanity(doc);
      if (!path) return entries;

      entries.push({
        url: toAbsoluteUrl(path),
        lastModified: doc._updatedAt ? new Date(doc._updatedAt) : undefined,
        changeFrequency: "weekly",
        priority: 0.8,
      });

      return entries;
    }, []);
  } catch (err) {
    console.error('[sitemap] Sanity fetch failed, continuing with Supabase only:', err);
    return [];
  }
}

// ─── Main sitemap ────────────────────────────────────────────────────────────

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch from both sources in parallel
  const [supabaseEntries, sanityEntries] = await Promise.all([
    fetchSupabaseSitemapEntries(),
    fetchSanitySitemapEntries(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: toAbsoluteUrl(page.path),
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: page.priority,
  }));

  // Deduplicate: Supabase takes priority over Sanity; filter test content
  const seen = new Set<string>();
  const allContentEntries: MetadataRoute.Sitemap = [];

  // Add Supabase entries first (primary source)
  for (const entry of supabaseEntries) {
    const normalized = entry.url.toLowerCase().replace(/\/+$/, '');
    if (!seen.has(normalized) && !isTestContent(normalized)) {
      seen.add(normalized);
      allContentEntries.push(entry);
    }
  }

  // Add Sanity entries only if not already covered by Supabase
  for (const entry of sanityEntries) {
    const normalized = entry.url.toLowerCase().replace(/\/+$/, '');
    if (!seen.has(normalized) && !isTestContent(normalized)) {
      seen.add(normalized);
      allContentEntries.push(entry);
    }
  }

  return [...staticEntries, ...allContentEntries];
}
