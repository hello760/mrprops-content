import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/content/PageBits";
import { GuidePostClient } from "@/components/client/GuidePostClient";
import { fetchGuideBySlug, fetchGuides } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createArticleSchema, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const guides = await fetchGuides();
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = await fetchGuideBySlug(slug);
  return buildMetadata(guide?.seoTitle || "Guides", guide?.seoDescription || "Property management guides.", `/guides/${slug}`);
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await fetchGuideBySlug(slug);
  if (!guide) notFound();

  const guides = await fetchGuides();
  const relatedGuides = guides.filter((item) => item.slug !== guide.slug).slice(0, 3);
  const path = `/guides/${guide.slug}`;
  const structuredData = buildStructuredData(
    createBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Guides", path: "/guides" },
      { name: guide.title },
    ]),
    createArticleSchema({
      headline: guide.title,
      description: guide.excerpt,
      path,
      datePublished: guide.publishedAt,
      dateModified: guide.updatedAt,
    }),
    createFaqSchema(guide.faqs),
  );

  return <><GuidePostClient guide={guide} relatedGuides={relatedGuides} /><JsonLd data={structuredData} /></>;
}
