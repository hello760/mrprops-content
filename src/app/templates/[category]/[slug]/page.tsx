import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/content/PageBits";
import { LeadGenTemplateClient } from "@/components/client/LeadGenTemplateClient";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";
import { fetchTemplatePage, getTemplateFallback, templateFallbacks } from "@/lib/template-tools";

export const revalidate = 3600;

export async function generateStaticParams() {
  return templateFallbacks.map((page) => ({ category: page.category, slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const page = (await fetchTemplatePage(category, slug)) || getTemplateFallback(category, slug);
  return buildMetadata(page?.seoTitle || "Templates", page?.seoDescription || "Template page.", `/templates/${category}/${slug}`, (page as any)?.heroImage);
}

export default async function TemplatePage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const page = (await fetchTemplatePage(category, slug)) || getTemplateFallback(category, slug);
  // Phase 5 P1 (2026-05-19): no 404s — 308 to nearest parent.
  // Google treats 308 identically to 301 for SEO ranking transfer.
  if (!page) permanentRedirect(`/templates/${category}`);
  const structuredData = buildStructuredData(
    createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Templates", path: "/templates" }, { name: page.title }]),
    createFaqSchema(page.faqs),
  );
  return <><LeadGenTemplateClient page={page} /><JsonLd data={structuredData} /></>;
}
