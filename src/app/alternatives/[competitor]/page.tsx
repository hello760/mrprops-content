import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlternativeView } from "@/components/content/views/AlternativeView";
import { fetchAlternatives, fetchAlternativeBySlug } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const pages = await fetchAlternatives();
  return pages.map((page) => ({ competitor: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ competitor: string }> }): Promise<Metadata> {
  const { competitor } = await params;
  const page = await fetchAlternativeBySlug(competitor);
  return buildMetadata(page?.seoTitle || "Alternatives", page?.seoDescription || "Alternative page.", `/alternatives/${competitor}`);
}

export default async function AlternativePage({ params }: { params: Promise<{ competitor: string }> }) {
  const { competitor } = await params;
  const alternative = await fetchAlternativeBySlug(competitor);
  if (!alternative) notFound();
  const competitorName = alternative.competitorName || alternative.title.replace(/ Alternative$/i, "") || competitor;
  const faqs = alternative.faqs?.length ? alternative.faqs : [{ question: `Why hosts are leaving ${competitorName}?`, answer: `Operators usually leave ${competitorName} when they want cleaner workflows, better visibility, and less operational drag.` }];
  const structuredData = buildStructuredData(
    createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Alternatives", path: "/alternatives" }, { name: alternative.title }]),
    createFaqSchema(faqs),
  );
  return (
    <>
      <AlternativeView alternative={alternative} competitor={competitor} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  );
}
