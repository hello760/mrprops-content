import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/content/PageBits";
import { LeadGenTemplateClient } from "@/components/client/LeadGenTemplateClient";
import { fetchTemplates, splitNestedSlug } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const revalidate = 3600;
export async function generateStaticParams() { const pages = await fetchTemplates(); return pages.map((page) => { const [category, slug] = splitNestedSlug(page.slug, "templates", 2); return { category, slug }; }); }
export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> { const { category, slug } = await params; const page = (await fetchTemplates()).find((item) => { const [c, s] = splitNestedSlug(item.slug, "templates", 2); return c === category && s === slug; }); return buildMetadata(page?.seoTitle || "Templates", page?.seoDescription || "Template page.", `/templates/${category}/${slug}`); }

export default async function TemplatePage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const page = (await fetchTemplates()).find((item) => { const [c, s] = splitNestedSlug(item.slug, "templates", 2); return c === category && s === slug; });
  if (!page) notFound();
  const structuredData = buildStructuredData(createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Templates", path: "/templates" }, { name: page.title }]), createFaqSchema(page.faqs));
  return <><LeadGenTemplateClient page={{ ...page, category }} /><JsonLd data={structuredData} /></>;
}
