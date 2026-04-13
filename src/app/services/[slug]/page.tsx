import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageView } from "@/components/content/LandingPageView";
import { fetchLandingPageBySlug, fetchLandingPages } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createBreadcrumbSchema, createFaqSchema, createSoftwareApplicationSchema } from "@/lib/structured-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const pages = await fetchLandingPages("services");
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchLandingPageBySlug("services", slug);
  return buildMetadata(page?.seoTitle || "Services", page?.seoDescription || "Mr. Props services.", `/services/${slug}`);
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchLandingPageBySlug("services", slug);
  if (!page) notFound();

  const structuredData = buildStructuredData(
    createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, { name: page.title }]),
    createSoftwareApplicationSchema(`/services/${page.slug}`),
    createFaqSchema(page.faqs),
  );

  return (
    <>
      <LandingPageView page={page} pageType="services" slug={slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  );
}
