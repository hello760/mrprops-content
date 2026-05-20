import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
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
  return buildMetadata(guide?.seoTitle || "Guides", guide?.seoDescription || "Property management guides.", `/guides/${slug}`, (guide as any)?.image);
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await fetchGuideBySlug(slug);
  // Phase 5 P1 (2026-05-19): no 404s — 308 to nearest parent.
  // Google treats 308 identically to 301 for SEO ranking transfer.
  if (!guide) permanentRedirect("/guides");

  const allGuides = await fetchGuides();
  const relatedGuides = allGuides.filter((item) => item.slug !== guide.slug).slice(0, 3);
  // CC↔Live truth fix (2026-05-18): drop hardcoded FAQ fallback. If CC has no
  // FAQs in this guide, the FAQ block doesn't render at all. Previously this
  // injected 2 generic FAQs ("How do I apply…", "Is this relevant for smaller
  // portfolios?") that the team couldn't see or edit in CC — exactly the
  // class of issue Helvis flagged: "content on live that's not in CC."
  // See: .claude/specs/mrprops-cc-live-truth-fix-2026-05-18.md (Fix A part 1).
  const faqs = guide.faqs?.length ? guide.faqs : [];

  const structuredData = buildStructuredData(
    createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }, { name: guide.title }]),
    createArticleSchema({ headline: guide.title, description: guide.excerpt, path: `/guides/${guide.slug}`, datePublished: guide.publishedAt, dateModified: guide.updatedAt }),
    // Only inject FAQ schema when CC has actual FAQs. buildStructuredData
    // filters null/undefined automatically — no spread needed.
    faqs.length > 0 ? createFaqSchema(faqs) : null,
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
