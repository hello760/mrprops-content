import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/content/PageBits";
import { GlossaryTermPageClient } from "@/components/client/GlossaryTermPageClient";
import { fetchGlossaryTermBySlug, fetchGlossaryTerms } from "@/lib/glossary";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createBreadcrumbSchema, createDefinedTermSchema, createFaqSchema } from "@/lib/structured-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const terms = await fetchGlossaryTerms();
  return terms.map((term) => ({ slug: term.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const term = await fetchGlossaryTermBySlug(slug);
  if (!term) return buildMetadata("Glossary", "Short-term rental terms explained.", `/glossary/${slug}`);
  return buildMetadata(term.seoTitle, term.seoDescription, `/glossary/${term.slug}`);
}

export default async function GlossaryTermPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const term = await fetchGlossaryTermBySlug(slug);
  if (!term) notFound();

  const path = `/glossary/${term.slug}`;
  const structuredData = buildStructuredData(
    createBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Glossary", path: "/glossary" },
      { name: term.term },
    ]),
    createDefinedTermSchema({
      name: term.term,
      description: term.definition,
      path,
    }),
    createFaqSchema(term.faqs)
  );

  return <><GlossaryTermPageClient term={term} /><JsonLd data={structuredData} /></>;
}
