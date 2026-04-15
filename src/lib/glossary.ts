import { cache } from "react";
import { calculateReadTime, formatDisplayDate, portableTextToPlainText, startCaseSlug, stripPrefix, type PortableTextBlock } from "@/lib/content-helpers";
import { sanityFetch } from "@/lib/sanity";

// ─── Supabase direct-read (Sanity replacement, Phase 4E) ─────────────────────
// Only active when SUPABASE_URL is configured. Falls back to Sanity otherwise.
let supabaseClient: ReturnType<typeof import('@supabase/supabase-js').createClient> | null = null;
async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return null;
  const { createClient } = await import('@supabase/supabase-js');
  supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  return supabaseClient;
}

async function fetchGlossaryFromSupabase(slug: string): Promise<GlossaryTerm | null> {
  const sb = await getSupabaseClient();
  if (!sb) return null; // Supabase not configured, fall back to Sanity

  const clientId = process.env.MR_PROPS_CLIENT_ID;
  if (!clientId) return null;

  // Normalize slug for matching
  const baseSlug = slug.replace(/^(glossary\/)?/, '').replace(/^what-is-/, '');
  const whatIsSlug = `what-is-${baseSlug}`;
  const glossaryWhatIs = `glossary/${whatIsSlug}`;

  const { data: rawData, error } = await sb
    .from('content_pieces')
    .select('id, custom_slug, title, content_type, content_body, structured_data, seo_title, seo_description, published_at')
    .eq('client_id', clientId)
    .eq('writing_status', 'published')
    .not('structured_data', 'is', null)
    .or(`custom_slug.eq.${glossaryWhatIs},custom_slug.eq.glossary/${baseSlug},custom_slug.eq.${whatIsSlug},custom_slug.eq.${baseSlug}`)
    .single();

  const data = rawData as Record<string, any> | null;
  if (error || !data || !data.structured_data) return null;

  const sd = data.structured_data as Record<string, any>;
  const bodyHtml = (data.content_body || '') as string;
  const plainText = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  // Map structured_data to GlossaryTerm interface (field-by-field)
  return {
    id: data.id,
    slug: normalizeGlossarySlug(data.custom_slug) || whatIsSlug,
    term: sd.term || data.title || 'Term',
    definition: sd.definition || '',
    body: [],
    bodyHtml: bodyHtml || undefined,
    relatedTerms: sd.relatedTerms || [],
    seoTitle: sd.seoTitle || data.seo_title || `What is ${sd.term}? | Mr. Props`,
    seoDescription: sd.seoDescription || data.seo_description || sd.definition || '',
    publishedAt: data.published_at || undefined,
    updatedAt: data.published_at || undefined,
    date: formatDisplayDate(data.published_at),
    readTime: calculateReadTime(plainText),
    definitionPrefix: sd.definitionPrefix || undefined,
    conceptImageUrl: sd.conceptImage?.url || undefined,
    conceptImageAlt: sd.conceptImage?.alt || undefined,
    proTipBadge: sd.proTip?.badge || undefined,
    proTipTitle: sd.proTip?.title || undefined,
    proTipDescription: sd.proTip?.description || undefined,
    proTipButtonLabel: sd.proTip?.buttonLabel || undefined,
    faqTitle: `Frequently Asked Questions about ${sd.term || data.title}`,
    faqs: (sd.faqs || []).map((f: any) => ({ question: f.question, answer: f.answer })),
    ctaTitle: sd.cta?.title || undefined,
    ctaText: sd.cta?.text || undefined,
    ctaPrimaryButton: sd.cta?.primaryButton || undefined,
  };
}

export interface GlossaryTerm {
  id: string;
  slug: string;
  term: string;
  definition: string;
  body: PortableTextBlock[];
  relatedTerms: string[];
  seoTitle: string;
  seoDescription: string;
  publishedAt?: string;
  updatedAt?: string;
  date: string;
  readTime: string;
  definitionPrefix?: string;
  conceptImageUrl?: string;
  conceptImageAlt?: string;
  proTipBadge?: string;
  proTipTitle?: string;
  proTipDescription?: string;
  proTipButtonLabel?: string;
  faqTitle?: string;
  faqs?: Array<{ question: string; answer: string }>;
  ctaTitle?: string;
  ctaText?: string;
  ctaPrimaryButton?: { label: string; href?: string };
  bodyHtml?: string;
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
  _updatedAt?: string;
  relatedTerms?: Array<string | { term?: string; title?: string; slug?: { current?: string } }>;
  definitionPrefix?: string;
  conceptImage?: { asset?: { _ref?: string; url?: string }; alt?: string };
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
    publishedAt: doc.publishedAt,
    updatedAt: doc._updatedAt || doc.publishedAt,
    date: formatDisplayDate(doc.publishedAt),
    readTime: calculateReadTime(plainTextBody),
    definitionPrefix: doc.definitionPrefix,
    conceptImageUrl: doc.conceptImage?.asset?.url || undefined,
    conceptImageAlt: doc.conceptImage?.alt || undefined,
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
  _id, title, term, slug, excerpt, definition, body, seoTitle, seoDescription, publishedAt, _updatedAt, relatedTerms, definitionPrefix, conceptImage{alt, asset->{_ref, url}}, proTipBadge, proTipTitle, proTipDescription, proTipButtonLabel, faqTitle, faqs, ctaTitle, ctaText, ctaPrimaryButton
}`;

const BY_SLUG_QUERY = `*[_type == "glossaryTerm" && slug.current in [$slug, $prefixedSlug, $baseSlug, $prefixedBaseSlug, $whatIsSlug, $prefixedWhatIsSlug]][0]{
  _id, title, term, slug, excerpt, definition, body, seoTitle, seoDescription, publishedAt, _updatedAt, definitionPrefix, conceptImage{alt, asset->{_ref, url}}, proTipBadge, proTipTitle, proTipDescription, proTipButtonLabel, faqTitle, faqs, ctaTitle, ctaText, ctaPrimaryButton,
  relatedTerms[]{..., term, title, slug}
}`;

export const fetchGlossaryTerms = cache(async () => {
  const docs = await sanityFetch<SanityGlossaryDocument[]>(LIST_QUERY);
  return docs.map(normalizeGlossaryTerm);
});

export const fetchGlossaryTermBySlug = cache(async (slug: string) => {
  // Try Supabase first (direct structured_data, no lossy extraction)
  const supabaseResult = await fetchGlossaryFromSupabase(slug);
  if (supabaseResult) return supabaseResult;

  // Fall back to Sanity for content not yet migrated
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
