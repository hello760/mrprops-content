import type { Metadata } from "next";
import { RegulationsIndexClient } from "@/components/client/RegulationsIndexClient";
import { fetchRegulations } from "@/lib/content-pages";

export const revalidate = 3600;

const ITEMS_PER_PAGE = 9;
const BASE_DESC =
  "Local short-term rental regulations by city and country. Permits, zoning, taxes, and enforcement guides for Airbnb hosts.";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const items = await fetchRegulations();
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const requested = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const page = Math.min(requested, totalPages);
  const canonical = page <= 1 ? "/regulations" : `/regulations?page=${page}`;
  const title = page <= 1 ? "Regulations" : `Regulations — Page ${page}`;
  return {
    title,
    description: BASE_DESC,
    alternates: { canonical },
    openGraph: { title, description: BASE_DESC, url: canonical, type: "website" },
    twitter: { card: "summary_large_image", title, description: BASE_DESC },
  };
}

export default async function RegulationsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const regulations = await fetchRegulations();
  const requested = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(regulations.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(requested, totalPages);
  return <RegulationsIndexClient regulations={regulations} currentPage={currentPage} />;
}
