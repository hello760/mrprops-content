import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RegulationView } from "@/components/content/views/RegulationView";
import { fetchRegulations, fetchRegulationBySlug, splitNestedSlug } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const pages = await fetchRegulations();
  return pages.map((page) => {
    const [platform, location] = splitNestedSlug(page.slug, "regulations", 2);
    return { platform, location };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ platform: string; location: string }> }): Promise<Metadata> {
  const { platform, location } = await params;
  const page = await fetchRegulationBySlug(platform, location);
  return buildMetadata(page?.seoTitle || "Regulations", page?.seoDescription || "Regulation guide.", `/regulations/${platform}/${location}`);
}

export default async function RegulationPage({ params }: { params: Promise<{ platform: string; location: string }> }) {
  const { platform, location } = await params;
  const regulation = await fetchRegulationBySlug(platform, location);
  if (!regulation) notFound();
  const faqs = regulation.faqs?.length ? regulation.faqs : [];
  const structuredData = buildStructuredData(
    createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Regulations", path: "/regulations" }, { name: regulation.title }]),
    createFaqSchema(faqs),
  );
  return (
    <>
      <RegulationView regulation={regulation} platform={platform} location={location} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  );
}
