import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createArticleSchema, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";
import { fetchGuideBySlug, fetchGuides } from "@/lib/content-pages";
import { GuidePostClient } from "@/components/client/GuidePostClient";
import { SEOContentSkeleton } from "@/components/content/SEOContentSkeleton";

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

  const allGuides = await fetchGuides();
  const relatedGuides = allGuides.filter((item) => item.slug !== guide.slug).slice(0, 3);
  const faqs = guide.faqs?.length ? guide.faqs : [
    { question: `How do I apply ${guide.title}?`, answer: "Start with the workflow that creates the most operational friction, then layer in the next improvement after it is stable." },
    { question: "Is this relevant for smaller portfolios?", answer: "Yes. Most of these systems matter even more when a small team is wearing every hat." },
  ];

  const structuredData = buildStructuredData(
    createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }, { name: guide.title }]),
    createArticleSchema({ headline: guide.title, description: guide.excerpt, path: `/guides/${guide.slug}`, datePublished: guide.publishedAt, dateModified: guide.updatedAt }),
    createFaqSchema(faqs),
  );

  return (
    <>
      <GuidePostClient guide={guide} relatedGuides={relatedGuides} />
      <div className="container mx-auto px-4 max-w-screen-xl pb-20">
        {/* FIX-008-v2 (PF-08, 2026-04-20): omit ctaTitle/ctaText/button props for guide pages.
            The SEOContentSkeleton's final CTA section renders a big service-page-styled block
            (gradient background, <h2> 6xl, primary + secondary buttons) when ctaTitle is
            truthy — PDF GLOBAL 3 for guides explicitly bans service-page-mimicking CTAs.
            Keep FAQ accordion but skip the CTA block. Guides close with their own concluding
            paragraph inside the body per PDF spec. */}
        <SEOContentSkeleton
          seoTitle={guide.seoTitle}
          seoDescription={guide.seoDescription}
          slug={`/guides/${guide.slug}`}
          mainTitle=""
          introText=""
          faqTitle={guide.faqTitle}
          faqs={faqs}
        />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  );
}
