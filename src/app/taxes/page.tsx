import type { Metadata } from "next";
import { TaxesIndexClient } from "@/components/client/TaxesIndexClient";
import { fetchTaxes } from "@/lib/content-pages";

export const revalidate = 3600;

const ITEMS_PER_PAGE = 9;
const BASE_DESC =
  "Short-term rental tax compliance guides by state, country, and city. Lodging taxes, income tax, and filing rules for Airbnb hosts.";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const items = await fetchTaxes();
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const requested = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const page = Math.min(requested, totalPages);
  const canonical = page <= 1 ? "/taxes" : `/taxes?page=${page}`;
  const title = page <= 1 ? "Taxes" : `Taxes — Page ${page}`;
  return {
    title,
    description: BASE_DESC,
    alternates: { canonical },
    openGraph: { title, description: BASE_DESC, url: canonical, type: "website" },
    twitter: { card: "summary_large_image", title, description: BASE_DESC },
  };
}

export default async function TaxesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const taxes = await fetchTaxes();
  const requested = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(taxes.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(requested, totalPages);
  return <TaxesIndexClient taxes={taxes} currentPage={currentPage} />;
}
