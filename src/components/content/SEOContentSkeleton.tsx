import { CTA } from "@/components/sections/CTA";
import { FAQ } from "@/components/sections/FAQ";

interface SEOContentSkeletonProps {
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  mainTitle?: string;
  introText?: string;
  benefits?: string[];
  faqTitle?: string;
  faqs?: Array<{ question: string; answer: string }>;
  ctaTitle?: string;
  ctaText?: string;
  ctaButtonText?: string;
  ctaButtonHref?: string;
}

export function SEOContentSkeleton({
  mainTitle,
  introText,
  benefits,
  faqTitle,
  faqs,
  ctaTitle,
  ctaText,
  ctaButtonText,
  ctaButtonHref,
}: SEOContentSkeletonProps) {
  return (
    <>
      {(mainTitle || introText || benefits?.length) ? (
        <section className="mb-16 space-y-8">
          {mainTitle ? <h2 className="font-display text-3xl font-bold">{mainTitle}</h2> : null}
          {introText ? <p className="text-lg text-muted-foreground leading-relaxed">{introText}</p> : null}
          {benefits?.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {benefits.map((benefit) => (
                <li key={benefit} className="rounded-xl border border-border bg-card px-5 py-4 text-sm font-medium">
                  {benefit}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
      <FAQ title={faqTitle} items={faqs} />
      <CTA title={ctaTitle} text={ctaText} primaryButton={ctaButtonText ? { label: ctaButtonText, href: ctaButtonHref } : undefined} />
    </>
  );
}
