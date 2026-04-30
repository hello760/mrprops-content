import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaxesIndexClient } from "@/components/client/TaxesIndexClient";
import { fetchTaxes } from "@/lib/content-pages";

export const revalidate = 3600;
const ITEMS_PER_PAGE = 9;

function titleCasePlatform(slug: string) {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export async function generateStaticParams() {
  const items = await fetchTaxes();
  const platforms = new Set<string>();
  for (const t of items) {
    if (t.platform) platforms.add(t.platform);
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
  const items = (await fetchTaxes()).filter((t) => t.platform === platform);
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const requested = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const page = Math.min(requested, totalPages);
  const canonical = page <= 1 ? `/taxes/${platform}` : `/taxes/${platform}?page=${page}`;
  const title = page <= 1 ? `${label} Taxes` : `${label} Taxes — Page ${page}`;
  const description = `Short-term rental tax compliance guides for ${label} hosts. Lodging tax, occupancy tax, income tax, and filing rules by state and country.`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TaxesPlatformPage({
  params,
  searchParams,
}: {
  params: Promise<{ platform: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { platform } = await params;
  const { page: pageParam } = await searchParams;
  const all = await fetchTaxes();
  const filtered = all.filter((t) => t.platform === platform);
  const requested = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(requested, totalPages);

  const knownPlatforms = new Set(all.map((t) => t.platform).filter(Boolean) as string[]);
  if (!knownPlatforms.has(platform) && filtered.length === 0) {
    notFound();
  }

  const allPlatforms = Array.from(new Set(all.map((t) => t.platform).filter(Boolean) as string[]));
  return (
    <TaxesIndexClient
      taxes={filtered}
      currentPage={currentPage}
      currentPlatform={platform}
      allPlatforms={allPlatforms}
    />
  );
}
