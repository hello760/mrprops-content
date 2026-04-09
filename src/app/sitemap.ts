import type { MetadataRoute } from "next";
import { sanityFetch } from "@/lib/sanity";

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

function buildContentPath(doc: SitemapDoc) {
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
    case "regulationPage":
    case "taxPage":
    case "leadGenTemplatePage":
    case "calculatorToolPage":
      return rawSlug.startsWith("/") ? rawSlug : `/${rawSlug}`;
    default:
      return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: toAbsoluteUrl(page.path),
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: page.priority,
  }));

  const contentEntries = docs.reduce<MetadataRoute.Sitemap>((entries, doc) => {
    const path = buildContentPath(doc);
    if (!path) return entries;

    entries.push({
      url: toAbsoluteUrl(path),
      lastModified: doc._updatedAt ? new Date(doc._updatedAt) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    });

    return entries;
  }, []);

  return [...staticEntries, ...contentEntries];
}
