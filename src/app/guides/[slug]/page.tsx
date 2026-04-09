import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, FAQAndCTA, JsonLd, ProseBody } from "@/components/content/PageBits";
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
  return buildMetadata(guide?.seoTitle || 'Guides', guide?.seoDescription || 'Property management guides.', `/guides/${slug}`);
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await fetchGuideBySlug(slug);
  if (!guide) notFound();

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
    createFaqSchema(guide.faqs)
  );

  return <div className="min-h-screen bg-background pb-20 pt-8"><div className="container mx-auto px-4 max-w-screen-xl"><Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Guides', href: '/guides' }, { label: guide.title }]} /><div className="max-w-4xl"><div className="mb-8"><div className="text-sm font-bold text-primary uppercase tracking-wider mb-2">{guide.date} · {guide.readTime}</div><h1 className="font-display text-4xl md:text-6xl font-bold mb-4">{guide.title}</h1><p className="text-xl text-muted-foreground">{guide.excerpt}</p></div><ProseBody blocks={guide.body} /></div><FAQAndCTA faqs={guide.faqs} faqTitle={guide.faqTitle} ctaTitle={guide.ctaTitle} ctaText={guide.ctaText} ctaPrimaryButton={guide.ctaPrimaryButton} ctaSecondaryButton={guide.ctaSecondaryButton} /></div><JsonLd data={structuredData} /></div>;
}
