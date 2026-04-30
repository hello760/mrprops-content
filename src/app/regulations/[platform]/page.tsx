import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RegulationsIndexClient } from "@/components/client/RegulationsIndexClient";
import { fetchRegulations } from "@/lib/content-pages";

export const revalidate = 3600;
const ITEMS_PER_PAGE = 9;

function titleCasePlatform(slug: string) {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export async function generateStaticParams() {
  const items = await fetchRegulations();
  const platforms = new Set<string>();
  for (const r of items) {
    if (r.platform) platforms.add(r.platform);
  }
  return Array.from(platforms).map((platform) => ({ platform }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ platform: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { platform } = await params;
  const { page: pageParam } = await searchParams;
  const label = titleCasePlatform(platform);
  const items = (await fetchRegulations()).filter((r) => r.platform === platform);
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const requested = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const page = Math.min(requested, totalPages);
  const canonical = page <= 1 ? `/regulations/${platform}` : `/regulations/${platform}?page=${page}`;
  const title = page <= 1 ? `${label} Regulations` : `${label} Regulations — Page ${page}`;
  const description = `Local short-term rental regulations for ${label} hosts. Permits, zoning, taxes, and enforcement guides by city and country.`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function RegulationsPlatformPage({
  params,
  searchParams,
}: {
  params: Promise<{ platform: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { platform } = await params;
  const { page: pageParam } = await searchParams;
  const all = await fetchRegulations();
  // Empty-state still renders the page (with the platform pill highlighted) so a
  // visitor seeing /regulations/<platform> for a platform that has no content
  // yet sees the structure and a clear "no items" message rather than a 404.
  const filtered = all.filter((r) => r.platform === platform);
  const requested = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(requested, totalPages);

  // 404 only for clearly-bogus platforms — any platform that has at least one
  // regulation OR matches the known-platform list renders with empty state.
  const knownPlatforms = new Set(all.map((r) => r.platform).filter(Boolean) as string[]);
  if (!knownPlatforms.has(platform) && filtered.length === 0) {
    notFound();
  }

  const allPlatforms = Array.from(new Set(all.map((r) => r.platform).filter(Boolean) as string[]));
  return (
    <RegulationsIndexClient
      regulations={filtered}
      currentPage={currentPage}
      currentPlatform={platform}
      allPlatforms={allPlatforms}
    />
  );
}
