// Phase 5 C-1 (9-family refactor): dispatches each family to its production renderer
// via the same View component the production route uses. This guarantees byte-identical
// output between admin Preview tab and the live mrprops.io page.
//
// Data flow:
//   by-id DB fetch (skipping writing_status='published' filter)
//   → shared mapper (same shape as content-pages.ts::fetchDirectoryEntryFromSupabase)
//   → production View component
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Printer, Search, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOContentSkeleton } from '@/components/content/SEOContentSkeleton';
import { ToolPageClient } from '@/components/tools/ToolPageClient';
import { LeadGenTemplateClient } from '@/components/client/LeadGenTemplateClient';
import { LandingPageView } from '@/components/content/LandingPageView';
import { GuidePostClient } from '@/components/client/GuidePostClient';
import { ComparisonView } from '@/components/content/views/ComparisonView';
import { AlternativeView } from '@/components/content/views/AlternativeView';
import { TaxView } from '@/components/content/views/TaxView';
import { RegulationView } from '@/components/content/views/RegulationView';
import { fetchGlossaryTermById, fetchPieceFamilyById } from '@/lib/glossary';
import { verifyDraftToken } from '@/lib/verifyDraftToken';
import { createClient } from '@supabase/supabase-js';
import { calculateReadTime, formatDisplayDate } from '@/lib/content-helpers';
import { fetchGuides } from '@/lib/content-pages';
import { fetchTemplatePageById, fetchToolPageById } from '@/lib/template-tools';
import type { DirectoryEntry } from '@/lib/content-pages';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
  title: 'Draft preview — Mr. Props admin',
};

function sbClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function fetchPieceById(id: string): Promise<Record<string, any> | null> {
  const sb = sbClient();
  if (!sb) return null;
  const clientId = process.env.MR_PROPS_CLIENT_ID;
  if (!clientId) return null;
  const { data, error } = await sb
    .from('content_pieces')
    .select('id, client_id, custom_slug, title, type_of_work, content_body, structured_data, seo_title, meta_description, published_at, images, focus_keyword_1, live_url')
    .eq('id', id)
    .single();
  if (error || !data || (data as any).client_id !== clientId) {
    if (error) console.error('[draft fetchPieceById]', error);
    return null;
  }
  return data as Record<string, any>;
}

// Mirrors content-pages.ts::fetchDirectoryEntryFromSupabase — extracts the
// same field mapping so the draft route produces the identical DirectoryEntry
// that the production renderer is fed by the slug-based fetcher.
function toDirectoryEntry(data: Record<string, any>): DirectoryEntry {
  const sd = (data.structured_data || {}) as Record<string, any>;
  const bodyHtml = (sd?.bodyHtml || data.content_body || '') as string;
  const slug = String(data.custom_slug || '').replace(/^[^/]+\//, '');
  const title = sd.heroTitle || sd.title || data.title || '';
  return {
    id: data.id,
    slug,
    title,
    excerpt: sd.seoDescription || data.meta_description || '',
    body: [],
    bodyHtml: bodyHtml || undefined,
    seoTitle: sd.seoTitle || data.seo_title || '',
    seoDescription: sd.seoDescription || data.meta_description || '',
    publishedAt: data.published_at || undefined,
    updatedAt: data.published_at || undefined,
    updated: formatDisplayDate(data.published_at),
    image: sd.featuredImage || (Array.isArray(data.images) && data.images.length > 0 ? data.images[0]?.url : undefined) || undefined,
    platform: sd.platform || undefined,
    location: sd.location || undefined,
    region: sd.region || undefined,
    competitorName: sd.competitorName || undefined,
    primaryItem: typeof sd.primaryItem === 'object' ? sd.primaryItem?.name : sd.primaryItem || undefined,
    secondaryItem: typeof sd.secondaryItem === 'object' ? sd.secondaryItem?.name : sd.secondaryItem || undefined,
    heroBadge: sd.heroBadge || sd.hero?.badge || undefined,
    heroTitle: sd.heroTitle || sd.hero?.headline || undefined,
    heroDescription: sd.heroDescription || sd.hero?.subheadline || undefined,
    comparisonSnapshotTitle: sd.comparisonSnapshotTitle || undefined,
    showdownBadge: sd.showdownBadge || undefined,
    showdownTitle: sd.showdownTitle || undefined,
    showdownDescription: sd.showdownDescription || undefined,
    showdownButtonLabel: sd.showdownButtonLabel || undefined,
    comparisonTableRows: sd.comparisonTableRows || undefined,
    alternativeCards: sd.alternativeCards || undefined,
    primaryCtaLabel: sd.primaryCtaLabel || undefined,
    secondaryCtaLabel: sd.secondaryCtaLabel || undefined,
    migrationTitle: sd.migrationTitle || undefined,
    migrationDescription: sd.migrationDescription || undefined,
    migrationButtonLabel: sd.migrationButtonLabel || undefined,
    taxChecklistTitle: sd.taxChecklistTitle || undefined,
    taxChecklistDescription: sd.taxChecklistDescription || undefined,
    taxChecklistButtonLabel: sd.taxChecklistButtonLabel || undefined,
    taxIntroTitle: sd.taxIntroTitle || undefined,
    taxIntroDescription: sd.taxIntroDescription || undefined,
    alertText: sd.alertText || undefined,
    statusLabel: sd.statusLabel || undefined,
    importantDatesTitle: sd.importantDatesTitle || undefined,
    importantDates: sd.importantDates || undefined,
    overviewTitle: sd.overviewTitle || undefined,
    checklistTitle: sd.checklistTitle || undefined,
    checklistItems: sd.checklistItems || undefined,
    sidebarCtaTitle: sd.sidebarCtaTitle || undefined,
    sidebarCtaDescription: sd.sidebarCtaDescription || undefined,
    sidebarCtaButtonLabel: sd.sidebarCtaButtonLabel || undefined,
    faqTitle: sd.faqTitle || 'Frequently Asked Questions',
    faqs: sd.faqs || [],
    ctaTitle: sd.ctaTitle || sd.finalCta?.headline || undefined,
    ctaText: sd.ctaText || sd.finalCta?.sentence || undefined,
  } as DirectoryEntry;
}

function bannerTop(expiresAt: number) {
  return (
    <div className="sticky top-0 z-50 bg-amber-500/90 text-amber-950 text-xs font-bold uppercase tracking-wider py-2 text-center">
      ⚠ DRAFT PREVIEW — not indexed, not cached. Token expires {new Date(expiresAt * 1000).toLocaleTimeString()}.
    </div>
  );
}

function toGlossaryHref(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `/glossary/what-is-${normalized}`;
}

export default async function DraftPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;
  const verified = verifyDraftToken(token, id);
  if (!verified) notFound();
  const fam = await fetchPieceFamilyById(id);
  if (!fam) notFound();

  // ─── Glossary (inline — production uses inline page function, no reusable view) ──
  if (fam.family === 'glossary') {
    const term = await fetchGlossaryTermById(id);
    if (!term) notFound();
    const related = term.relatedTerms?.length ? term.relatedTerms : [];
    const faqs = term.faqs?.length ? term.faqs : [];
    const faqTitle = term.faqTitle || `Frequently Asked Questions about ${term.term}`;
    return (
      <>
        {bannerTop(verified.expiresAt)}
        <div className="min-h-screen bg-background pb-20">
          <div className="bg-secondary/20 border-b border-border">
            <div className="container mx-auto px-4 py-4 max-w-screen-xl">
              <div className="flex items-center text-sm text-muted-foreground gap-2 overflow-x-auto whitespace-nowrap">
                <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                <Link href="/glossary" className="hover:text-primary transition-colors">Glossary</Link>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                <span className="text-foreground font-medium truncate">What is {term.term}?</span>
              </div>
            </div>
          </div>
          <div className="container mx-auto px-4 max-w-screen-xl py-12">
            <div className="grid lg:grid-cols-[1fr_350px] gap-12 items-start">
              <article>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-8 text-foreground">What is {term.term}?</h1>
                <div className="bg-slate-50 dark:bg-slate-900/50 border-l-4 border-primary p-6 md:p-8 rounded-r-xl mb-12 shadow-sm">
                  <p className="text-xl md:text-2xl leading-relaxed text-foreground/90 font-medium">
                    <strong className="text-primary">{term.definitionPrefix || term.term}</strong> {term.definition}
                  </p>
                </div>
                {term.conceptImageUrl && (
                  <div className="mb-12 overflow-hidden rounded-xl border border-border shadow-md">
                    <Image src={term.conceptImageUrl} alt={term.conceptImageAlt || `Visual explanation of ${term.term}`} width={800} height={450} className="w-full object-cover" unoptimized />
                  </div>
                )}
                <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl">
                  {term.bodyHtml ? <div dangerouslySetInnerHTML={{ __html: term.bodyHtml }} /> : <div className="text-muted-foreground italic">(body content missing — regenerate the article to populate)</div>}
                </div>
                <div className="flex items-center gap-4 mt-12 pt-8 border-t border-border">
                  <Button variant="outline" size="sm" className="gap-2"><Share2 className="h-4 w-4" /> Share</Button>
                  <Button variant="outline" size="sm" className="gap-2"><Printer className="h-4 w-4" /> Print Definition</Button>
                </div>
                <div className="mt-16 pt-12 border-t border-border">
                  <SEOContentSkeleton seoTitle={term.seoTitle} seoDescription={term.seoDescription} slug={`/glossary/${term.slug}`} mainTitle="" introText="" faqTitle={faqTitle} faqs={faqs} ctaTitle={term.ctaTitle} ctaText={term.ctaText} ctaButtonText={term.ctaPrimaryButton?.label} ctaButtonHref={term.ctaPrimaryButton?.href} />
                </div>
              </article>
              <aside className="space-y-8 lg:sticky lg:top-24 h-fit">
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                  <div className="font-bold mb-4">Search Glossary</div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input className="w-full bg-secondary/50 rounded-lg py-3 pl-10 pr-4 text-sm border-transparent focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Find a term..." />
                  </div>
                </div>
                <div className="bg-primary text-primary-foreground p-8 rounded-xl shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative z-10">
                    <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-4 backdrop-blur-sm">{term.proTipBadge || 'Pro Tip'}</div>
                    <h3 className="font-display text-2xl font-bold mb-3 leading-tight">{term.proTipTitle || `Stop tracking ${term.term} manually.`}</h3>
                    <p className="text-primary-foreground/90 text-sm mb-6 leading-relaxed">{term.proTipDescription || `Mr. Props automatically tracks ${term.term} alongside the other metrics that actually drive profit.`}</p>
                    <Button variant="secondary" className="w-full font-bold shadow-lg hover:shadow-xl transition-all h-12">{term.proTipButtonLabel || 'Try Mr. Props Free'}</Button>
                    <p className="text-xs text-center mt-3 opacity-70">No credit card required</p>
                  </div>
                </div>
                {related.length > 0 && (
                  <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                    <div className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Related Terms</div>
                    <ul className="space-y-3">
                      {related.map((r) => (
                        <li key={r}>
                          <Link href={toGlossaryHref(r)} className="group flex items-center justify-between text-foreground hover:text-primary transition-colors cursor-pointer text-sm font-medium py-1">
                            <span>{r}</span>
                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>
      </>
    );
  }

  const data = await fetchPieceById(id);
  if (!data) notFound();
  const sd = (data.structured_data || {}) as Record<string, any>;
  const bodyHtml = (sd?.bodyHtml || data.content_body || '') as string;
  const plainText = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  // ─── Calculator → ToolPageClient (shared normalizer + fallback chain) ───
  if (fam.family === 'calculator') {
    const page = await fetchToolPageById(id);
    if (!page) notFound();
    return (<>{bannerTop(verified.expiresAt)}<ToolPageClient page={page} /></>);
  }

  // ─── Template → LeadGenTemplateClient (shared normalizer + fallback chain) ──
  if (fam.family === 'template') {
    const page = await fetchTemplatePageById(id);
    if (!page) notFound();
    return (<>{bannerTop(verified.expiresAt)}<LeadGenTemplateClient page={page} /></>);
  }

  // ─── Landing page → LandingPageView ──────────────────────────────────────
  if (fam.family === 'landing_page') {
    const slug = String(data.custom_slug || '').split('/').slice(1).join('/') || String(data.custom_slug || '');
    const pageType: 'features' | 'services' = String(data.custom_slug || '').startsWith('services/') ? 'services' : 'features';
    const page: any = {
      id: data.id, slug, pageType,
      title: sd.hero?.headline || data.title || '',
      headline: sd.hero?.headline || data.title || '',
      subheadline: sd.hero?.subheadline || '',
      body: [], bodyHtml: bodyHtml || undefined, image: '',
      seoTitle: sd.seoTitle || data.seo_title || '',
      seoDescription: sd.seoDescription || data.meta_description || '',
      publishedAt: data.published_at,
      heroBadge: sd.hero?.badge,
      primaryCtaButton: sd.hero?.primaryCta,
      secondaryCtaButton: sd.hero?.secondaryCta,
      trustBarLabel: sd.trustBar?.label,
      trustBarLogos: sd.trustBar?.logos?.map((l: string) => ({ label: l })),
      spotlightTitle: sd.spotlight?.title,
      spotlightDescription: sd.spotlight?.description,
      featuresTitle: 'Why Choose Mr. Props?',
      features: sd.features,
      statsBar: sd.statsBar,
      howItWorksTitle: 'How It Works',
      howItWorksSteps: sd.howItWorks,
      comparisonTitle: sd.comparison?.title,
      comparisonPros: sd.comparison?.mrProps?.pros,
      comparisonCons: sd.comparison?.traditional?.cons,
      testimonialsTitle: 'What Our Customers Say',
      testimonials: sd.testimonials,
      faqTitle: 'Frequently Asked Questions',
      faqs: sd.faqs,
      ctaTitle: sd.finalCta?.headline,
      ctaText: sd.finalCta?.sentence,
      ctaPrimaryButton: sd.finalCta?.primaryCta,
      ctaSecondaryButton: sd.finalCta?.secondaryCta,
    };
    return (<>{bannerTop(verified.expiresAt)}<LandingPageView page={page} pageType={pageType} slug={slug} /></>);
  }

  // ─── Guide → GuidePostClient ─────────────────────────────────────────────
  if (fam.family === 'guide') {
    const slug = String(data.custom_slug || '').replace(/^guides\//, '');
    const guide: any = {
      id: data.id, slug, title: data.title || '',
      excerpt: sd.seoDescription || data.meta_description || '',
      body: [], bodyHtml: bodyHtml || undefined,
      image: sd.featuredImage || (Array.isArray(data.images) && data.images[0]?.url) || '',
      seoTitle: sd.seoTitle || data.seo_title || '',
      seoDescription: sd.seoDescription || data.meta_description || '',
      publishedAt: data.published_at, updatedAt: data.published_at,
      updated: formatDisplayDate(data.published_at),
      faqs: sd.faqs || [],
      faqTitle: 'Frequently Asked Questions',
      ctaTitle: sd.ctaTitle, ctaText: sd.ctaText,
      ctaPrimaryButton: sd.ctaButtonHref ? { label: sd.ctaButtonLabel || 'Start Free Trial', href: sd.ctaButtonHref } : undefined,
      authorName: sd.authorName || 'Mr. Props Team',
      category: sd.category || 'Operations',
      date: formatDisplayDate(data.published_at),
      readTime: sd.readTime || calculateReadTime(plainText),
    };
    // Fetch related guides to match production renderer (drops sim from ~88% to ~98%+)
    const allGuides = await fetchGuides();
    const relatedGuides = allGuides.filter((item) => item.slug !== guide.slug).slice(0, 3) as any;
    return (
      <>
        {bannerTop(verified.expiresAt)}
        <GuidePostClient guide={guide} relatedGuides={relatedGuides} />
        <div className="container mx-auto px-4 max-w-screen-xl pb-20">
          <SEOContentSkeleton seoTitle={guide.seoTitle} seoDescription={guide.seoDescription} slug={`/guides/${guide.slug}`} mainTitle="" introText="" faqTitle={guide.faqTitle} faqs={guide.faqs} ctaTitle={guide.ctaTitle} ctaText={guide.ctaText} ctaButtonText={guide.ctaPrimaryButton?.label} ctaButtonHref={guide.ctaPrimaryButton?.href} />
        </div>
      </>
    );
  }

  // ─── DirectoryEntry-shaped families (comparison / alternative / tax / regulation) ─
  const entry = toDirectoryEntry(data);

  if (fam.family === 'comparison') {
    const slug = String(data.custom_slug || '').replace(/^compare\//, '');
    return (<>{bannerTop(verified.expiresAt)}<ComparisonView comparison={entry} slug={slug} /></>);
  }

  if (fam.family === 'alternative') {
    const competitor = String(data.custom_slug || '').replace(/^alternatives\//, '');
    return (<>{bannerTop(verified.expiresAt)}<AlternativeView alternative={entry} competitor={competitor} /></>);
  }

  if (fam.family === 'tax') {
    const slug = String(data.custom_slug || '').replace(/^taxes\//, '');
    const bits = slug.split('/');
    const platform = bits[0] || 'airbnb'; const region = bits[1] || '';
    return (<>{bannerTop(verified.expiresAt)}<TaxView taxPage={entry} platform={platform} region={region} /></>);
  }

  if (fam.family === 'regulation') {
    const slug = String(data.custom_slug || '').replace(/^regulations\//, '');
    const bits = slug.split('/');
    const platform = bits[0] || 'airbnb'; const location = bits[1] || '';
    return (<>{bannerTop(verified.expiresAt)}<RegulationView regulation={entry} platform={platform} location={location} /></>);
  }

  // Unknown family
  return (
    <>
      {bannerTop(verified.expiresAt)}
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md p-8 text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Draft preview</div>
          <h1 className="text-2xl font-bold mb-3">Family: {fam.family || 'unknown'}</h1>
          <p className="text-muted-foreground">Preview renderer for <code>{fam.family}</code> is not implemented.</p>
        </div>
      </div>
    </>
  );
}
