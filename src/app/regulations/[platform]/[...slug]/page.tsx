import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { RegulationView } from "@/components/content/views/RegulationView";
import { fetchRegulations, fetchRegulationBySlug } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

/**
 * Catch-all regulations route — handles 1/2/3/N-segment slugs after the
 * platform segment. Replaces the previous fixed-2-segment route at
 * `[platform]/[location]/page.tsx` (deleted in PR #38).
 *
 * Why catch-all (Phase 4d, 2026-05-19):
 *   Mr Props regulations URLs vary by region:
 *     - EU / Asia / RoW: `/regulations/<platform>/<country>/<city>`  (3-seg)
 *     - US:               `/regulations/<platform>/<state>/<city>`   (3-seg)
 *     - Legacy:           `/regulations/<platform>/<location>`       (2-seg)
 *   Single `[...slug]` matches all of them. The slug structure is config-
 *   driven from the MMG Command Center Templates table (url_structure +
 *   url_structure_alt for US), not hard-coded in routing. Future URL
 *   pattern changes (drop a segment, add neighborhood, ISO codes, etc.)
 *   are a CC template edit + slug regenerate, no deploy needed.
 *
 * Missing-piece behavior:
 *   Helvis end-goal (2026-05-19): "URLs should not 404 — 301 to the most
 *   relevant URL." When a slug doesn't match any published CC piece, we
 *   `permanentRedirect(/regulations/<platform>)` to the platform index
 *   (which itself empty-state-renders if the platform has no content,
 *   then 404s only for clearly-bogus platforms). 308 is the modern
 *   permanent-redirect status; Google treats it identically to 301.
 */

export const revalidate = 3600;

export async function generateStaticParams() {
  const pages = await fetchRegulations();
  // Emit one entry per published piece. We extract slug tail by stripping
  // the `regulations/` prefix (if present) then splitting — no depth
  // constraint so this handles legacy 2-seg slugs (e.g. "airbnb/barcelona")
  // AND new 3-seg slugs ("airbnb/spain/barcelona") + any future shape.
  return pages
    .map((page) => {
      const raw = (page.slug || "").replace(/^regulations\//, "");
      const tail = raw.split("/").filter(Boolean);
      if (tail.length < 2) return null;
      const [platform, ...slug] = tail;
      if (!platform || slug.length === 0) return null;
      return { platform, slug };
    })
    .filter((p): p is { platform: string; slug: string[] } => p !== null);
}

export async function generateMetadata({ params }: { params: Promise<{ platform: string; slug: string[] }> }): Promise<Metadata> {
  const { platform, slug } = await params;
  const location = slug.join("/");
  const page = await fetchRegulationBySlug(platform, location);
  return buildMetadata(
    page?.seoTitle || "Regulations",
    page?.seoDescription || "Regulation guide.",
    `/regulations/${platform}/${location}`,
    page?.image,
  );
}

export default async function RegulationPage({ params }: { params: Promise<{ platform: string; slug: string[] }> }) {
  const { platform, slug } = await params;
  const location = slug.join("/");
  const regulation = await fetchRegulationBySlug(platform, location);
  if (!regulation) {
    // Phase 4d (2026-05-19): per Helvis end-goal, no 404s for regulations.
    // 308-redirect to the platform index — gives the user a useful landing
    // page (platform's regulations listing) instead of a dead end. Google
    // treats 308 identically to 301 for SEO ranking transfer.
    permanentRedirect(`/regulations/${platform}`);
  }
  // permanentRedirect() returns `never` — the lines below only execute when
  // regulation is non-null. Non-null assertions satisfy TS in this codebase's
  // tsconfig (same pre-existing pattern as old route + other family routes).
  const reg = regulation!;
  const faqs = reg.faqs?.length ? reg.faqs : [];
  const structuredData = buildStructuredData(
    createBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Regulations", path: "/regulations" },
      { name: reg.title },
    ]),
    createFaqSchema(faqs),
  );
  return (
    <>
      <RegulationView regulation={reg} platform={platform} location={location} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  );
}
