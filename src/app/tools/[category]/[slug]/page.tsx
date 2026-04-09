import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FAQAndCTA, JsonLd, ProseBody } from "@/components/content/PageBits";
import { fetchTools, splitNestedSlug } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const pages = await fetchTools();
  return pages.map((page) => {
    const [category, slug] = splitNestedSlug(page.slug, 'tools', 2);
    return { category, slug };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const page = (await fetchTools()).find((item) => {
    const [c, s] = splitNestedSlug(item.slug, 'tools', 2);
    return c === category && s === slug;
  });
  return buildMetadata(page?.seoTitle || 'Tools', page?.seoDescription || 'Tool page.', `/tools/${category}/${slug}`);
}

export default async function ToolPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const page = (await fetchTools()).find((item) => {
    const [c, s] = splitNestedSlug(item.slug, 'tools', 2);
    return c === category && s === slug;
  });
  if (!page) notFound();

  const path = `/tools/${category}/${slug}`;
  const structuredData = buildStructuredData(
    createBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Tools", path: "/tools" },
      { name: page.title },
    ]),
    createFaqSchema(page.faqs)
  );

  return <div className="min-h-screen bg-background pb-20 pt-8"><div className="container mx-auto px-4 max-w-screen-xl"><div className="text-center max-w-3xl mx-auto mb-12"><h1 className="font-display text-4xl md:text-6xl font-bold mb-6">{page.title}</h1><p className="text-xl text-muted-foreground mb-8">{page.excerpt}</p></div><div className="rounded-3xl border border-border bg-card p-8 shadow-xl mb-12"><div className="text-center"><div className="font-display text-3xl font-bold mb-3">{page.calculatorTitle || 'Calculator'}</div><p className="text-muted-foreground">{page.calculatorDescription || 'Interactive calculator UI coming from the same content family.'}</p></div></div><ProseBody blocks={page.body} /></div><FAQAndCTA faqs={page.faqs} faqTitle={page.faqTitle} ctaTitle={page.ctaTitle} ctaText={page.ctaText} ctaPrimaryButton={page.ctaPrimaryButton} ctaSecondaryButton={page.ctaSecondaryButton} /><JsonLd data={structuredData} /></div>;
}
