import { cache } from "react";
import { calculateReadTime, formatDisplayDate, startCaseSlug, stripPrefix, type PortableTextBlock } from "@/lib/content-helpers";
// Sanity removed — all content served from Supabase

// ─── Supabase direct-read (Sanity replacement, Phase 4E) ─────────────────────
// Only active when SUPABASE_URL is configured. Falls back to Sanity otherwise.
let supabaseClient: ReturnType<typeof import('@supabase/supabase-js').createClient> | null = null;
async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (!process.env.SUPABASE_URL || !(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '')) return null;
  const { createClient } = await import('@supabase/supabase-js');
  supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '');
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
    .select('id, custom_slug, title, type_of_work, content_body, structured_data, seo_title, meta_description, published_at')
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
    seoDescription: sd.seoDescription || data.meta_description || sd.definition || '',
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

// Sanity interfaces removed — all content from Supabase

function normalizeGlossarySlug(slug?: string) {
  return stripPrefix(slug, "glossary");
}

function glossarySlugBase(slug?: string | null) {
  return normalizeGlossarySlug(slug || "").replace(/^what-is-/, "").trim();
}

// Sanity normalize/query functions removed — all content from Supabase

export const fetchGlossaryTerms = cache(async () => {
  const sbTerms = await fetchGlossaryListFromSupabase();
  // Deduplicate by slug base
  const seen = new Set<string>();
  const result: GlossaryTerm[] = [];
  for (const term of sbTerms) {
    const base = glossarySlugBase(term.slug);
    if (!base || seen.has(base)) continue;
    seen.add(base);
    result.push(term);
  }
  return result;
});

async function fetchGlossaryListFromSupabase(): Promise<GlossaryTerm[]> {
  const sb = await getSupabaseClient();
  if (!sb) return [];
  const clientId = process.env.MR_PROPS_CLIENT_ID;
  if (!clientId) return [];

  const { data, error } = await sb
    .from('content_pieces')
    .select('id, custom_slug, title, content_body, structured_data, seo_title, meta_description, published_at')
    .eq('client_id', clientId)
    .eq('writing_status', 'published')
    .not('structured_data', 'is', null)
    .like('custom_slug', 'glossary/%')
    .order('title', { ascending: true });

  if (error || !data) return [];

  return data
    .filter((r: any) => r.custom_slug && !/-\d{8,}$/.test(r.custom_slug))
    .map((r: any) => {
      const sd = (r.structured_data || {}) as Record<string, any>;
      const bodyHtml = (r.content_body || '') as string;
      const plainText = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const slug = normalizeGlossarySlug(r.custom_slug);
      const term = sd.term || r.title || startCaseSlug(slug.replace(/^what-is-/, ''));

      return {
        id: r.id,
        slug,
        term,
        definition: sd.definition || '',
        body: [],
        bodyHtml: bodyHtml || undefined,
        relatedTerms: sd.relatedTerms || [],
        seoTitle: sd.seoTitle || r.seo_title || `What is ${term}? | Mr. Props`,
        seoDescription: sd.seoDescription || r.meta_description || '',
        publishedAt: r.published_at,
        date: formatDisplayDate(r.published_at),
        readTime: calculateReadTime(plainText),
        faqs: sd.faqs || [],
        ctaTitle: sd.cta?.title,
        ctaText: sd.cta?.text,
        ctaPrimaryButton: sd.cta?.primaryButton,
        conceptImageUrl: sd.conceptImage?.url,
      } as GlossaryTerm;
    });
}

export const fetchGlossaryTermBySlug = cache(async (slug: string) => {
  return fetchGlossaryFromSupabase(slug);
});

// ─── Phase 5 C-1: fetch-by-id for draft preview ──────────────────────────────
// Reads a glossary piece directly by id (not slug), WITHOUT the writing_status=published
// filter — drafts must also preview. Returns the same GlossaryTerm shape as the
// production fetcher, so the production renderer renders it identically.
export async function fetchGlossaryTermById(id: string): Promise<GlossaryTerm | null> {
  const sb = await getSupabaseClient();
  if (!sb) return null;
  const clientId = process.env.MR_PROPS_CLIENT_ID;
  if (!clientId) return null;

  const { data: rawData, error } = await sb
    .from('content_pieces')
    .select('id, custom_slug, title, type_of_work, content_body, structured_data, seo_title, meta_description, published_at, client_id')
    .eq('id', id)
    .single();

  const data = rawData as Record<string, any> | null;
  if (error || !data || data.client_id !== clientId) return null;

  const sd = (data.structured_data || {}) as Record<string, any>;
  const bodyHtml = (data.content_body || '') as string;
  const plainText = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const whatIsSlug = `what-is-${String(data.custom_slug || '').replace(/^(glossary\/)?/, '').replace(/^what-is-/, '')}`;

  return {
    id: data.id,
    slug: normalizeGlossarySlug(data.custom_slug) || whatIsSlug,
    term: sd.term || data.title || 'Term',
    definition: sd.definition || '',
    body: [],
    bodyHtml: bodyHtml || undefined,
    relatedTerms: sd.relatedTerms || [],
    seoTitle: sd.seoTitle || data.seo_title || `What is ${sd.term}? | Mr. Props`,
    seoDescription: sd.seoDescription || data.meta_description || sd.definition || '',
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

// Returns the piece's family (from custom_slug prefix) + raw row, used by the
// draft dispatcher to pick the right renderer.
export async function fetchPieceFamilyById(id: string): Promise<{ family: string | null; custom_slug: string | null; title: string | null } | null> {
  const sb = await getSupabaseClient();
  if (!sb) return null;
  const clientId = process.env.MR_PROPS_CLIENT_ID;
  if (!clientId) return null;
  const { data, error } = await sb
    .from('content_pieces')
    .select('id, custom_slug, title, client_id')
    .eq('id', id)
    .single();
  const row = data as Record<string, any> | null;
  if (error || !row || row.client_id !== clientId) return null;

  const prefix = String(row.custom_slug || '').split('/')[0];
  const prefixToFamily: Record<string, string> = {
    glossary: 'glossary',
    tools: 'calculator',
    templates: 'template',
    taxes: 'tax',
    compare: 'comparison',
    alternatives: 'alternative',
    regulations: 'regulation',
    guides: 'guide',
    features: 'landing_page',
    services: 'landing_page',
  };
  return { family: prefixToFamily[prefix] || null, custom_slug: row.custom_slug || null, title: row.title || null };
}
