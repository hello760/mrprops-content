import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/content/PageBits";
import { ComparisonView } from "@/components/content/views/ComparisonView";
import { fetchComparisons, fetchComparisonBySlug } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const pages = await fetchComparisons();
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchComparisonBySlug(slug);
  return buildMetadata(page?.seoTitle || "Compare", page?.seoDescription || "Comparison page.", `/compare/${slug}`, page?.image);
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comparison = await fetchComparisonBySlug(slug);
  // Phase 5 P1 (2026-05-19): no 404s — 308 to nearest parent.
  // Google treats 308 identically to 301 for SEO ranking transfer.
  if (!comparison) permanentRedirect("/compare");
  const structuredData = buildStructuredData(
    createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Compare", path: "/compare" }, { name: comparison.title }]),
    createFaqSchema(comparison.faqs),
  );
  return (
    <>
      <ComparisonView comparison={comparison} slug={slug} />
      <JsonLd data={structuredData} />
    </>
  );
}
