import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageView } from "@/components/content/LandingPageView";
import { fetchLandingPageBySlug, fetchLandingPages } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createBreadcrumbSchema, createFaqSchema, createSoftwareApplicationSchema } from "@/lib/structured-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const pages = await fetchLandingPages("features");
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchLandingPageBySlug("features", slug);
  return buildMetadata(page?.seoTitle || "Features", page?.seoDescription || "Mr. Props features.", `/features/${slug}`);
}

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchLandingPageBySlug("features", slug);
  if (!page) notFound();

  const structuredData = buildStructuredData(
    createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Features", path: "/features" }, { name: page.title }]),
    createSoftwareApplicationSchema(`/features/${page.slug}`),
    createFaqSchema(page.faqs),
  );

  return (
    <>
      <LandingPageView page={page} pageType="features" slug={slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  );
}
