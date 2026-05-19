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
  // CC↔Live truth fix (2026-05-19, Phase 2): invert Phase 5 L3 precedence.
  // Helvis end goal: "content should not appear on the live Mr Props page if it
  // is not visible in MMG Command Center." content_body is the editor's source
  // of truth; sd.bodyHtml is a derived cache that drifts when BSD doesn't re-run.
  // Render-time stripRedundantBodyBlocks(...) + markdownToHtml(...) still run in
  // glossary/[slug]/page.tsx:99, so we don't lose the duplicate-H1 strip.
  // See: .claude/specs/mrprops-cc-live-truth-fix-2026-05-18.md (Fix B, glossary).
  const bodyHtml = (data.content_body || sd?.bodyHtml || '') as string;
  const plainText = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  // CC↔Live truth fix (2026-05-19, Phase 2 Fix D): clean term fallback chain.
  // Was: `sd.term || data.title || 'Term'` — when sd.term was null (most legacy
  // pieces), this fell to `data.title` carrying "What Is X? A Simple Guide…",
  // then page.tsx wrapped it as `<h1>What is ${term.term}?</h1>` producing
  // "What is What Is X? A Simple Guide … ?" — the exact symptom Helvis showed
  // at Loom 11:35-11:56. Listing fetcher at line 227-228 already uses this clean
  // chain (PR #14); this mirrors it to the detail fetcher.
  const cleanedTerm = sd.term || cleanTitleToTerm(data.seo_title || data.title) || startCaseSlugProper(data.custom_slug);

  // Map structured_data to GlossaryTerm interface (field-by-field)
  return {
    id: data.id,
    slug: normalizeGlossarySlug(data.custom_slug) || whatIsSlug,
    term: cleanedTerm,
    definition: sd.definition || '',
    body: [],
    bodyHtml: bodyHtml || undefined,
    relatedTerms: sd.relatedTerms || [],
    // Use cleanedTerm (not raw sd.term, which is often null) so the SEO title
    // doesn't render as "What is undefined? | Mr. Props".
    seoTitle: sd.seoTitle || data.seo_title || `What is ${cleanedTerm}? | Mr. Props`,
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
    // CC↔Live truth fix (2026-05-19, Phase 4 follow-up): drop the
    // unconditional `Frequently Asked Questions about ${term}` fallback —
    // it rendered an H2 even when CC had no faqs[]. Now reads directly
    // from sd.faqTitle (which the CC editor exposes via the Pro Tip / FAQ
    // panel). When unset, the consumer render skips the FAQ section.
    faqTitle: sd.faqTitle,
    faqs: (sd.faqs || []).map((f: any) => ({ question: f.question, answer: f.answer })),
    ctaTitle: sd.cta?.title || undefined,
    ctaText: sd.cta?.text || undefined,
    ctaPrimaryButton: sd.cta?.primaryButton || undefined,
  };
}

/**
 * FIX-025 (PF-25): relatedTerms upgraded from bare string[] to supporting
 * { term, relationship } objects per PDF glossary GLOBAL 8. Legacy pieces may
 * still have string[] in the DB — renderer tolerates both shapes.
 */
export type RelatedTerm = string | { term: string; relationship?: string };

export interface GlossaryTerm {
  id: string;
  slug: string;
  term: string;
  definition: string;
  body: PortableTextBlock[];
  relatedTerms: RelatedTerm[];
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

// --- Card display fallbacks (added 2026-05-07) ---
// Deriving uniform card headings + non-empty definitions for entries whose
// structured_data.term / structured_data.definition haven't been populated by
// the producer yet. The producer-side fix (in market-me-good's
// publish-mrprops-direct.ts) is tracked separately; this defends the listing UX
// in the meantime and stays as cheap insurance afterward.

const TITLE_CASE_LOWER = new Set([
  'a','an','the','and','but','or','nor','for','on','at','to','from','by','in','of','vs','via','as','with',
]);

function cleanTitleToTerm(title: string | null | undefined): string | null {
  if (!title) return null;
  let s = title.trim();
  // Strip leading "What Is " / "What is " / "What's "
  s = s.replace(/^(What [Ii]s |What's )/, '');
  // Strip leading article
  s = s.replace(/^(a |an |the )/i, '');
  // Cut at first separator: ?, :, |, OR space-padded dash variants
  s = s.split(/\s+[-–—‒]\s+|[?:|]/, 1)[0].trim();
  return (s.length >= 1 && s.length <= 45) ? s : null;
}

function startCaseSlugProper(rawSlug: string | null | undefined): string {
  const base = (rawSlug || '').replace(/^glossary\//, '').replace(/^what-is-/, '');
  const words = base.split('-').filter(Boolean);
  return words
    .map((w, i) => {
      if (i > 0 && TITLE_CASE_LOWER.has(w.toLowerCase())) return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

function firstSentence(rawText: string | null | undefined, maxChars = 200): string {
  if (!rawText) return '';
  let plain = String(rawText).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  // Fix space-before-punct artifacts left over from HTML stripping
  plain = plain.replace(/\s+([,.;:!?])/g, '$1');
  if (!plain) return '';
  const m = plain.match(/^(.{20,180}?[.!?])(?:\s|$)/);
  if (m) return m[1].trim();
  if (plain.length > maxChars) {
    return plain.slice(0, maxChars).replace(/\s\S*$/, '') + '…';
  }
  return plain;
}

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
    // Listing visibility fix (2026-05-06): the publish flow has been writing
    // glossary slugs in two shapes — `glossary/{slug}` (legacy) and `what-is-{slug}`
    // (current, since 2026-04-21). The detail fetcher already accepts both via
    // .or() (see fetchGlossaryFromSupabase above). The listing was matching only
    // the legacy shape, hiding 46 published articles. This OR mirrors the detail
    // fetcher's tolerance. Producer-side fix is the long-term answer — restore
    // the `glossary/` prefix in market-me-good `publish-mrprops-direct.ts` and
    // backfill — but is tracked as a separate task to avoid cross-repo coupling.
    .or('custom_slug.like.glossary/%,custom_slug.like.what-is-%')
    .order('title', { ascending: true });

  if (error || !data) return [];

  return data
    .filter((r: any) => {
      if (!r.custom_slug || /-\d{8,}$/.test(r.custom_slug)) return false;
      // Drop rows where every potential content source is empty — prevents
      // shell cards rendering with no heading + no body. Currently 0 rows match.
      const sd = (r.structured_data || {}) as Record<string, any>;
      return Boolean(sd.term || sd.definition || r.meta_description || r.content_body);
    })
    .map((r: any) => {
      const sd = (r.structured_data || {}) as Record<string, any>;
      // CC↔Live truth fix (2026-05-19, Phase 2 Fix B, listing fetcher): same
      // precedence inversion — content_body first, sd.bodyHtml as legacy fallback.
      const bodyHtml = (r.content_body || sd?.bodyHtml || '') as string;
      const plainText = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const slug = normalizeGlossarySlug(r.custom_slug);
      // Term fallback chain: curated sd.term → cleaned title → titleized slug.
      const term =
        sd.term ||
        cleanTitleToTerm(r.seo_title || r.title) ||
        startCaseSlugProper(r.custom_slug);

      return {
        id: r.id,
        slug,
        term,
        // Definition fallback chain: curated sd.definition → first sentence of
        // bodyHtml/content_body → meta_description → empty (filtered above).
        definition:
          sd.definition ||
          firstSentence(r.content_body || sd?.bodyHtml) ||
          r.meta_description ||
          '',
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
  // CC↔Live truth fix (2026-05-19, Phase 2 Fix B): invert precedence — same
  // reasoning as fetchGlossaryBySlug above. content_body is source of truth.
  const bodyHtml = (data.content_body || sd?.bodyHtml || '') as string;
  const plainText = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const whatIsSlug = `what-is-${String(data.custom_slug || '').replace(/^(glossary\/)?/, '').replace(/^what-is-/, '')}`;
  // CC↔Live truth fix (2026-05-19, Phase 2 Fix D): clean term fallback chain
  // mirroring fetchGlossaryBySlug and the listing fetcher (line 227-228).
  const cleanedTerm = sd.term || cleanTitleToTerm(data.seo_title || data.title) || startCaseSlugProper(data.custom_slug);

  return {
    id: data.id,
    slug: normalizeGlossarySlug(data.custom_slug) || whatIsSlug,
    term: cleanedTerm,
    definition: sd.definition || '',
    body: [],
    bodyHtml: bodyHtml || undefined,
    relatedTerms: sd.relatedTerms || [],
    seoTitle: sd.seoTitle || data.seo_title || `What is ${cleanedTerm}? | Mr. Props`,
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
    // CC↔Live truth fix (2026-05-19, Phase 4 follow-up): drop the
    // unconditional `Frequently Asked Questions about ${term}` fallback —
    // it rendered an H2 even when CC had no faqs[]. Now reads directly
    // from sd.faqTitle (which the CC editor exposes via the Pro Tip / FAQ
    // panel). When unset, the consumer render skips the FAQ section.
    faqTitle: sd.faqTitle,
    faqs: (sd.faqs || []).map((f: any) => ({ question: f.question, answer: f.answer })),
    ctaTitle: sd.cta?.title || undefined,
    ctaText: sd.cta?.text || undefined,
    ctaPrimaryButton: sd.cta?.primaryButton || undefined,
  };
}

// Returns the piece's family (from custom_slug prefix OR live_url prefix) + raw row.
// Used by the draft dispatcher to pick the right renderer. custom_slug is preferred,
// but some legacy pieces have unprefixed slugs (e.g. 'cleaning-fee-calculator')
// whose live URL lives under a category path ('/tools/cleaning/…'); those need the
// live_url fallback to classify correctly.
export async function fetchPieceFamilyById(id: string): Promise<{ family: string | null; custom_slug: string | null; title: string | null; live_url: string | null; type_of_work: string | null } | null> {
  const sb = await getSupabaseClient();
  if (!sb) return null;
  const clientId = process.env.MR_PROPS_CLIENT_ID;
  if (!clientId) return null;
  const { data, error } = await sb
    .from('content_pieces')
    .select('id, custom_slug, title, client_id, live_url, type_of_work')
    .eq('id', id)
    .single();
  const row = data as Record<string, any> | null;
  if (error || !row || row.client_id !== clientId) return null;

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
  const slugPrefix = String(row.custom_slug || '').split('/')[0];
  let family = prefixToFamily[slugPrefix] || null;
  if (!family && row.live_url) {
    try {
      const path = new URL(row.live_url).pathname;
      const urlPrefix = path.split('/').filter(Boolean)[0];
      family = prefixToFamily[urlPrefix] || null;
    } catch {}
  }
  // Last-resort: type_of_work-based inference for unmapped pieces.
  if (!family) {
    const tow = String(row.type_of_work || '').toLowerCase();
    if (tow === 'tool_calculator' || tow === 'calculator') family = 'calculator';
    else if (tow === 'service_page' || tow === 'landing_page') family = 'landing_page';
  }
  return { family, custom_slug: row.custom_slug || null, title: row.title || null, live_url: row.live_url || null, type_of_work: row.type_of_work || null };
}
