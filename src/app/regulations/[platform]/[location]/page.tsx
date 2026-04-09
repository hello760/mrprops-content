import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FAQAndCTA, JsonLd, ProseBody } from "@/components/content/PageBits";
import { fetchRegulations, splitNestedSlug } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const pages = await fetchRegulations();
  return pages.map((page) => {
    const [platform, location] = splitNestedSlug(page.slug, 'regulations', 2);
    return { platform, location };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ platform: string; location: string }> }): Promise<Metadata> {
  const { platform, location } = await params;
  const page = (await fetchRegulations()).find((item) => {
    const [p, l] = splitNestedSlug(item.slug, 'regulations', 2);
    return p === platform && l === location;
  });
  return buildMetadata(page?.seoTitle || 'Regulations', page?.seoDescription || 'Regulation guide.', `/regulations/${platform}/${location}`);
}

export default async function RegulationPage({ params }: { params: Promise<{ platform: string; location: string }> }) {
  const { platform, location } = await params;
  const page = (await fetchRegulations()).find((item) => {
    const [p, l] = splitNestedSlug(item.slug, 'regulations', 2);
    return p === platform && l === location;
  });
  if (!page) notFound();

  const path = `/regulations/${platform}/${location}`;
  const structuredData = buildStructuredData(
    createBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Regulations", path: "/regulations" },
      { name: page.title },
    ]),
    createFaqSchema(page.faqs)
  );

  return <div className="min-h-screen bg-background pb-20"><div className="sticky top-0 z-40 bg-blue-500/10 border-b border-blue-500/20 text-blue-700 py-3 text-center text-sm font-medium px-4 backdrop-blur-sm">{page.alertText || 'Legal Alert: regulations change frequently. Verify locally.'}</div><div className="container mx-auto px-4 max-w-screen-xl mt-8"><div className="mb-8"><div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Local Regulations</div><h1 className="font-display text-4xl md:text-6xl font-bold mb-6">{page.title}</h1><div className="flex items-center gap-4 mb-8"><div className="px-4 py-2 rounded-full font-bold text-white bg-green-500">{page.statusLabel || 'Host Friendly'}</div><div className="text-sm text-muted-foreground">Last Updated: {page.updated}</div></div></div><ProseBody blocks={page.body} /></div><FAQAndCTA faqs={page.faqs} faqTitle={page.faqTitle} ctaTitle={page.ctaTitle} ctaText={page.ctaText} ctaPrimaryButton={page.ctaPrimaryButton} ctaSecondaryButton={page.ctaSecondaryButton} /><JsonLd data={structuredData} /></div>;
}
