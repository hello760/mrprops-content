import { cache } from "react";
import { calculateReadTime, formatDisplayDate, portableTextToPlainText, startCaseSlug, stripPrefix, type PortableTextBlock } from "@/lib/content-helpers";
import { sanityFetch } from "@/lib/sanity";

export interface GlossaryTerm {
  id: string;
  slug: string;
  term: string;
  definition: string;
  body: PortableTextBlock[];
  relatedTerms: string[];
  seoTitle: string;
  seoDescription: string;
  date: string;
  readTime: string;
  definitionPrefix?: string;
  proTipBadge?: string;
  proTipTitle?: string;
  proTipDescription?: string;
  proTipButtonLabel?: string;
  faqTitle?: string;
  faqs?: Array<{ question: string; answer: string }>;
  ctaTitle?: string;
  ctaText?: string;
  ctaPrimaryButton?: { label: string; href?: string };
}

interface SanityGlossaryDocument {
  _id: string;
  title?: string;
  term?: string;
  slug?: { current?: string };
  excerpt?: string;
  definition?: string;
  body?: PortableTextBlock[];
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
  relatedTerms?: Array<string | { term?: string; title?: string; slug?: { current?: string } }>;
  definitionPrefix?: string;
  proTipBadge?: string;
  proTipTitle?: string;
  proTipDescription?: string;
  proTipButtonLabel?: string;
  faqTitle?: string;
  faqs?: Array<{ question?: string; answer?: string }>;
  ctaTitle?: string;
  ctaText?: string;
  ctaPrimaryButton?: { label?: string; href?: string };
}

function normalizeGlossarySlug(slug?: string) {
  return stripPrefix(slug, "glossary");
}

function glossarySlugBase(slug?: string | null) {
  return normalizeGlossarySlug(slug || "").replace(/^what-is-/, "").trim();
}

function normalizeRelatedTerms(relatedTerms?: SanityGlossaryDocument["relatedTerms"]) {
  return (relatedTerms || [])
    .map((item) => {
      if (typeof item === "string") return item;
      return item?.term || item?.title || startCaseSlug(glossarySlugBase(item?.slug?.current));
    })
    .filter(Boolean) as string[];
}

function defaultBody(definition: string): PortableTextBlock[] {
  return [{ _key: "definition", _type: "block", style: "normal", children: [{ _type: "span", text: definition }] }];
}

export function normalizeGlossaryTerm(doc: SanityGlossaryDocument): GlossaryTerm {
  const slug = normalizeGlossarySlug(doc.slug?.current) || `what-is-${(doc.term || doc.title || doc._id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  const term = doc.term || doc.title || startCaseSlug(slug.replace(/^what-is-/, "")) || "Term";
  const definition = doc.definition || doc.excerpt || portableTextToPlainText(doc.body).slice(0, 180) || `${term} explained for property managers.`;
  const body = doc.body?.length ? doc.body : defaultBody(definition);
  const plainTextBody = portableTextToPlainText(body) || definition;

  return {
    id: doc._id,
    slug,
    term,
    definition,
    body,
    relatedTerms: normalizeRelatedTerms(doc.relatedTerms),
    seoTitle: doc.seoTitle || `What is ${term}? | Mr. Props`,
    seoDescription: doc.seoDescription || definition,
    date: formatDisplayDate(doc.publishedAt),
    readTime: calculateReadTime(plainTextBody),
    definitionPrefix: doc.definitionPrefix,
    proTipBadge: doc.proTipBadge,
    proTipTitle: doc.proTipTitle,
    proTipDescription: doc.proTipDescription,
    proTipButtonLabel: doc.proTipButtonLabel,
    faqTitle: doc.faqTitle,
    faqs: (doc.faqs || []).filter((item) => item?.question && item?.answer).map((item) => ({ question: item.question!, answer: item.answer! })),
    ctaTitle: doc.ctaTitle,
    ctaText: doc.ctaText,
    ctaPrimaryButton: doc.ctaPrimaryButton?.label ? { label: doc.ctaPrimaryButton.label, href: doc.ctaPrimaryButton.href } : undefined,
  };
}

const LIST_QUERY = `*[_type == "glossaryTerm" && defined(slug.current)]|order(coalesce(term, title) asc){
  _id, title, term, slug, excerpt, definition, body, seoTitle, seoDescription, publishedAt, relatedTerms, definitionPrefix, proTipBadge, proTipTitle, proTipDescription, proTipButtonLabel, faqTitle, faqs, ctaTitle, ctaText, ctaPrimaryButton
}`;

const BY_SLUG_QUERY = `*[_type == "glossaryTerm" && slug.current in [$slug, $prefixedSlug, $baseSlug, $prefixedBaseSlug, $whatIsSlug, $prefixedWhatIsSlug]][0]{
  _id, title, term, slug, excerpt, definition, body, seoTitle, seoDescription, publishedAt, definitionPrefix, proTipBadge, proTipTitle, proTipDescription, proTipButtonLabel, faqTitle, faqs, ctaTitle, ctaText, ctaPrimaryButton,
  relatedTerms[]{..., term, title, slug}
}`;

export const fetchGlossaryTerms = cache(async () => {
  const docs = await sanityFetch<SanityGlossaryDocument[]>(LIST_QUERY);
  return docs.map(normalizeGlossaryTerm);
});

export const fetchGlossaryTermBySlug = cache(async (slug: string) => {
  const normalized = normalizeGlossarySlug(slug);
  const baseSlug = glossarySlugBase(slug);
  const whatIsSlug = baseSlug ? `what-is-${baseSlug}` : normalized;
  const doc = await sanityFetch<SanityGlossaryDocument | null>(BY_SLUG_QUERY, {
    slug: normalized,
    prefixedSlug: `glossary/${normalized}`,
    baseSlug,
    prefixedBaseSlug: `glossary/${baseSlug}`,
    whatIsSlug,
    prefixedWhatIsSlug: `glossary/${whatIsSlug}`,
  });
  return doc ? normalizeGlossaryTerm(doc) : null;
});
