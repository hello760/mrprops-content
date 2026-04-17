import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaxView } from "@/components/content/views/TaxView";
import { fetchTaxes, fetchTaxBySlug, splitNestedSlug } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const pages = await fetchTaxes();
  return pages.map((page) => {
    const [platform, region] = splitNestedSlug(page.slug, "taxes", 2);
    return { platform, region };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ platform: string; region: string }> }): Promise<Metadata> {
  const { platform, region } = await params;
  const page = await fetchTaxBySlug(platform, region);
  return buildMetadata(page?.seoTitle || "Taxes", page?.seoDescription || "Tax guide.", `/taxes/${platform}/${region}`);
}

export default async function TaxPage({ params }: { params: Promise<{ platform: string; region: string }> }) {
  const { platform, region } = await params;
  const taxPage = await fetchTaxBySlug(platform, region);
  if (!taxPage) notFound();
  const faqs = taxPage.faqs?.length ? taxPage.faqs : [];
  const structuredData = buildStructuredData(
    createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Taxes", path: "/taxes" }, { name: taxPage.title }]),
    createFaqSchema(faqs),
  );
  return (
    <>
      <TaxView taxPage={taxPage} platform={platform} region={region} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  );
}
