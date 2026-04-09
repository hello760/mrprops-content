import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FAQAndCTA, JsonLd, ProseBody } from "@/components/content/PageBits";
import { fetchLandingPageBySlug, fetchLandingPages } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createBreadcrumbSchema, createFaqSchema, createSoftwareApplicationSchema } from "@/lib/structured-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const pages = await fetchLandingPages('services');
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchLandingPageBySlug('services', slug);
  return buildMetadata(page?.seoTitle || 'Services', page?.seoDescription || 'Mr. Props services.', `/services/${slug}`);
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchLandingPageBySlug('services', slug);
  if (!page) notFound();

  const path = `/services/${page.slug}`;
  const structuredData = buildStructuredData(
    createBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
      { name: page.title },
    ]),
    createSoftwareApplicationSchema(path),
    createFaqSchema(page.faqs)
  );

  return <div className="min-h-screen bg-background"><section className="container mx-auto px-4 py-20 max-w-6xl"><div className="grid lg:grid-cols-2 gap-12 items-center"><div><div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-4">{page.heroBadge || 'Solution'}</div><h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6">{page.headline}</h1><p className="text-xl text-muted-foreground mb-8">{page.subheadline}</p></div><div className="rounded-[32px] border border-border bg-card min-h-[360px] shadow-xl" style={{backgroundImage:`url(${page.image})`,backgroundSize:'cover',backgroundPosition:'center'}} /></div></section><section className="container mx-auto px-4 max-w-screen-xl pb-20"><ProseBody blocks={page.body} /></section><FAQAndCTA faqs={page.faqs} faqTitle={page.faqTitle} ctaTitle={page.ctaTitle} ctaText={page.ctaText} ctaPrimaryButton={page.ctaPrimaryButton} ctaSecondaryButton={page.ctaSecondaryButton} /><JsonLd data={structuredData} /></div>;
}
