// Phase 5 C-1 (expanded to all 9 families).
// Renders a content piece by id, WITHOUT ISR caching, WITHOUT static generation.
// Gated by HMAC token from the admin side. Invalid/expired → notFound() (no existence leak).
//
// Each family dispatches to its production renderer. For glossary, the renderer is
// duplicated inline because the production /glossary/[slug]/page.tsx is a Next.js
// page function. For calculator/template/landing_page/guide we import the existing
// client components directly. For comparison/alternative/tax/regulation the
// production pages are inline page.tsx files; draft route duplicates the JSX.
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle, AlertTriangle, Check, CheckSquare,
  ChevronRight, Download, FileCheck, Home, Minus, Printer, Search, Share2,
  Trophy, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOContentSkeleton } from '@/components/content/SEOContentSkeleton';
import { ToolPageClient } from '@/components/tools/ToolPageClient';
import { LeadGenTemplateClient } from '@/components/client/LeadGenTemplateClient';
import { LandingPageView } from '@/components/content/LandingPageView';
import { GuidePostClient } from '@/components/client/GuidePostClient';
import { fetchGlossaryTermById, fetchPieceFamilyById } from '@/lib/glossary';
import { verifyDraftToken } from '@/lib/verifyDraftToken';
import { createClient } from '@supabase/supabase-js';
import { calculateReadTime, formatDisplayDate } from '@/lib/content-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
  title: 'Draft preview — Mr. Props admin',
};

// ─── by-id DB read (skips writing_status='published' filter) ─────────────────
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
    .select('id, client_id, custom_slug, title, type_of_work, content_body, structured_data, seo_title, meta_description, published_at, images, focus_keyword_1, primary_keyword')
    .eq('id', id)
    .single();
  if (error || !data || (data as any).client_id !== clientId) return null;
  return data as Record<string, any>;
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

function renderCell(value: any, isPrimary = false) {
  if (value === true) return <Check className={`mx-auto h-5 w-5 ${isPrimary ? 'text-green-600' : 'text-gray-400'}`} />;
  if (value === false) return <Minus className="mx-auto h-5 w-5 text-gray-300" />;
  return <span>{String(value ?? '')}</span>;
}

// ─── Main dispatcher ─────────────────────────────────────────────────────────
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

  // ─── Glossary ──────────────────────────────────────────────────────────
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

  // ─── Calculator → ToolPageClient ─────────────────────────────────────────
  if (fam.family === 'calculator') {
    const page: any = {
      id: data.id,
      category: (String(data.custom_slug || '').split('/')[1] || 'general'),
      slug: String(data.custom_slug || '').split('/').slice(2).join('/') || String(data.custom_slug || ''),
      title: sd.mainTitle || data.title || '',
      description: sd.introText || '',
      seoTitle: sd.seoTitle || data.seo_title || '',
      seoDescription: sd.seoDescription || data.meta_description || '',
      mainTitle: sd.mainTitle || data.title || '',
      introText: sd.introText || '',
      benefits: sd.benefits || [],
      faqs: sd.faqs || [],
      body: [],
      bodyHtml: bodyHtml || undefined,
      calculatorUi: sd.calculatorUi || (sd.calculatorType ? { type: sd.calculatorType } : undefined),
      howItWorks: sd.howItWorks || undefined,
      cta: sd.cta || undefined,
    };
    return (
      <>
        {bannerTop(verified.expiresAt)}
        <ToolPageClient page={page} />
      </>
    );
  }

  // ─── Template → LeadGenTemplateClient ────────────────────────────────────
  if (fam.family === 'template') {
    const pathBits = String(data.custom_slug || '').split('/');
    const category = pathBits[1] || 'general';
    const slug = pathBits.slice(2).join('/') || pathBits[1] || '';
    const page: any = {
      id: data.id, category, slug,
      title: sd.hero?.previewTitle || data.title || '',
      badge: sd.hero?.badge || 'Template',
      description: sd.gate?.description || '',
      trustItems: sd.trustItems || [],
      previewTitle: sd.hero?.previewTitle || '',
      previewMeta: sd.hero?.previewMeta || '',
      previewBody: [],
      gateTitle: sd.gate?.title || '',
      gateDescription: sd.gate?.description || '',
      formPlaceholder: sd.gate?.formPlaceholder || 'Enter your email',
      formButtonLabel: sd.gate?.buttonLabel || 'Download',
      formDisclaimer: sd.gate?.disclaimer || '',
      whatIsTitle: sd.whatIsTitle || '',
      whatIsText: sd.whatIsText || '',
      useCasesTitle: sd.useCasesTitle || '',
      useCases: sd.useCases || [],
      customizeTitle: sd.customizeTitle || '',
      customizeText: sd.customizeText || '',
      faqTitle: 'Frequently Asked Questions',
      faqs: sd.faqs || [],
      resourcesTitle: sd.resourcesTitle || '',
      resources: (sd.resources || []).filter((r: any) => r && r.href),
      seoTitle: sd.seoTitle || data.seo_title || '',
      seoDescription: sd.seoDescription || data.meta_description || '',
      body: [],
      bodyHtml: bodyHtml || undefined,
    };
    return (
      <>
        {bannerTop(verified.expiresAt)}
        <LeadGenTemplateClient page={page} />
      </>
    );
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
    return (
      <>
        {bannerTop(verified.expiresAt)}
        <LandingPageView page={page} pageType={pageType} slug={slug} />
      </>
    );
  }

  // ─── Guide → GuidePostClient ─────────────────────────────────────────────
  if (fam.family === 'guide') {
    const slug = String(data.custom_slug || '').replace(/^guides\//, '');
    const guide: any = {
      id: data.id, slug, title: data.title || '',
      excerpt: sd.seoDescription || data.meta_description || '',
      body: [],
      bodyHtml: bodyHtml || undefined,
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
    return (
      <>
        {bannerTop(verified.expiresAt)}
        <GuidePostClient guide={guide} relatedGuides={[]} />
        <div className="container mx-auto px-4 max-w-screen-xl pb-20">
          <SEOContentSkeleton seoTitle={guide.seoTitle} seoDescription={guide.seoDescription} slug={`/guides/${guide.slug}`} mainTitle="" introText="" faqTitle={guide.faqTitle} faqs={guide.faqs} ctaTitle={guide.ctaTitle} ctaText={guide.ctaText} ctaButtonText={guide.ctaPrimaryButton?.label} ctaButtonHref={guide.ctaPrimaryButton?.href} />
        </div>
      </>
    );
  }

  // ─── Comparison (inline) ─────────────────────────────────────────────────
  if (fam.family === 'comparison') {
    const slug = String(data.custom_slug || '').replace(/^compare\//, '');
    const slugParts = slug.split('-vs-');
    const primary = typeof sd.primaryItem === 'object' ? sd.primaryItem?.name : sd.primaryItem;
    const secondary = typeof sd.secondaryItem === 'object' ? sd.secondaryItem?.name : sd.secondaryItem;
    const left = primary || slugParts[0] || 'A';
    const right = secondary || slugParts[1] || 'B';
    const title = sd.heroTitle || data.title || `${left} vs ${right}`;
    const rows = sd.comparisonTableRows?.length ? sd.comparisonTableRows : [];
    const faqs = sd.faqs?.length ? sd.faqs : [];
    return (
      <>
        {bannerTop(verified.expiresAt)}
        <div className="min-h-screen bg-background">
          <section className="px-4 pb-12 pt-16 md:pt-20">
            <div className="mx-auto max-w-6xl">
              <div className="mx-auto max-w-3xl text-center">
                <div className="mb-4 inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary md:text-sm">{sd.heroBadge || sd.showdownBadge || '2026 Software Showdown'}</div>
                <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">{title}</h1>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">{sd.heroDescription || sd.showdownDescription || `${left} and ${right} solve similar problems, but they are built for different kinds of operators.`}</p>
              </div>
              <div className="mt-10 overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#5b21b6_0%,#7c3aed_45%,#a855f7_100%)] px-6 py-8 text-white shadow-xl md:px-10 md:py-10">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/95"><Trophy className="h-4 w-4" />{sd.showdownBadge || 'Is there a better way?'}</div>
                  <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-5xl">{sd.showdownTitle || "Don't settle for \"good enough\""}</h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-white/88 md:text-lg">{sd.showdownDescription || `${left} and ${right} both have trade-offs. Mr. Props was built to close the operational gaps teams actually feel every day.`}</p>
                </div>
              </div>
            </div>
          </section>
          <div className="container mx-auto max-w-screen-xl px-4 pb-20">
            {rows.length > 0 && (
              <div id="full-breakdown" className="mb-20 scroll-mt-24">
                <div className="mb-6 text-center"><div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">Detailed comparison</div><h2 className="mt-2 font-display text-3xl font-bold">The Full Breakdown</h2></div>
                <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-xl">
                  <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                      <tr>
                        <th className="w-1/4 border-b border-border p-6 text-left text-lg font-bold text-muted-foreground">Feature</th>
                        <th className="w-1/4 border-b border-border bg-muted/20 p-6 text-center text-lg font-bold text-muted-foreground">{left}</th>
                        <th className="w-1/4 border-b border-border bg-muted/20 p-6 text-center text-lg font-bold text-muted-foreground">{right}</th>
                        <th className="relative w-1/4 border-b border-primary/20 bg-primary/10 p-6 text-center">
                          <div className="absolute left-0 right-0 top-0 h-1.5 bg-primary" />
                          <div className="font-display text-2xl font-bold text-primary">Mr. Props</div>
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-primary/70">Best Choice</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row: any, i: number) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="p-6 text-lg font-medium">{row.feature}</td>
                          <td className="border-r border-border/50 bg-muted/5 p-6 text-center text-muted-foreground">{renderCell(row.primaryValue ?? '')}</td>
                          <td className="border-r border-border/50 bg-muted/5 p-6 text-center text-muted-foreground">{renderCell(row.secondaryValue ?? '')}</td>
                          <td className="bg-primary/5 p-6 text-center text-lg font-bold text-foreground">{renderCell(row.mrPropsValue ?? '', true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {bodyHtml && (
              <div className="mb-20 rounded-[2rem] border border-border bg-card p-8 shadow-sm md:p-12">
                <div className="prose prose-lg max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              </div>
            )}
            <SEOContentSkeleton seoTitle={sd.seoTitle || data.seo_title || ''} seoDescription={sd.seoDescription || data.meta_description || ''} slug={`/compare/${slug}`} mainTitle="" introText="" faqTitle="Common Questions" faqs={faqs} ctaTitle={sd.ctaTitle || `Compare ${left} and ${right}`} ctaText={sd.ctaText || 'If you want modern operations without enterprise complexity, Mr. Props is built to help you move faster.'} ctaButtonText={sd.primaryCtaLabel || 'Start Free Migration'} />
          </div>
        </div>
      </>
    );
  }

  // ─── Alternative (inline) ────────────────────────────────────────────────
  if (fam.family === 'alternative') {
    const slug = String(data.custom_slug || '').replace(/^alternatives\//, '');
    const competitor = sd.competitorName || slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const cards = sd.alternativeCards?.length ? sd.alternativeCards : [];
    const rows = sd.comparisonTableRows || [];
    const faqs = sd.faqs?.length ? sd.faqs : [];
    return (
      <>
        {bannerTop(verified.expiresAt)}
        <div className="min-h-screen bg-background">
          <div className="relative pt-24 pb-20 bg-secondary/10 border-b border-border overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="container mx-auto px-4 text-center max-w-6xl relative z-10">
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-1.5 rounded-full font-bold text-sm mb-8"><AlertCircle className="h-4 w-4" /> {sd.heroBadge || 'Stop Overpaying'}</div>
              <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 tracking-tight">{sd.heroTitle || `The #1 Alternative to ${competitor}`}</h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">{sd.heroDescription || `Stop paying for features you do not use. Switch from ${competitor} to the modern standard for property management.`}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Button size="lg" className="rounded-full px-8 h-14 text-lg font-bold shadow-xl shadow-primary/20 w-full sm:w-auto">{sd.primaryCtaLabel || `Migrate from ${competitor}`}</Button>
                <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-lg font-bold border-2 w-full sm:w-auto">{sd.secondaryCtaLabel || 'See Comparison'}</Button>
              </div>
            </div>
          </div>
          <div className="container mx-auto px-4 py-24 max-w-screen-xl">
            <div className="grid md:grid-cols-3 gap-8 mb-24">
              {cards.map((c: any, i: number) => {
                const parts = (c.description || '').split(/\.\s+/);
                const pain = parts[0] || c.description; const solution = parts.slice(1).join('. ') || c.description;
                return (
                  <div key={i} className="bg-card border border-border p-8 rounded-3xl shadow-sm group">
                    <h3 className="font-display text-2xl font-bold mb-4">{c.title}</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2 text-red-500 bg-red-50 p-3 rounded-lg"><X className="h-4 w-4 mt-0.5 flex-shrink-0" /><span className="font-medium">{pain}</span></div>
                      <div className="flex items-start gap-2 text-green-600 bg-green-50 p-3 rounded-lg"><Check className="h-4 w-4 mt-0.5 flex-shrink-0" /><span className="font-medium">{solution}</span></div>
                    </div>
                    {c.features?.length > 0 && (
                      <ul className="mt-4 space-y-2 text-sm text-muted-foreground border-t border-border pt-4">
                        {c.features.map((f: string, fi: number) => <li key={fi} className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /><span>{f}</span></li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
            {rows.length > 0 && (
              <div className="mb-24">
                <div className="mb-8 text-center"><div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">Feature-by-feature breakdown</div><h2 className="mt-2 font-display text-3xl md:text-4xl font-bold">{competitor} vs Mr. Props</h2></div>
                <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-xl">
                  <table className="w-full min-w-[640px] border-collapse">
                    <thead>
                      <tr>
                        <th className="w-1/3 border-b border-border p-6 text-left text-lg font-bold text-muted-foreground">Feature</th>
                        <th className="relative w-1/3 border-b border-primary/20 bg-primary/10 p-6 text-center">
                          <div className="absolute left-0 right-0 top-0 h-1.5 bg-primary" />
                          <div className="font-display text-xl font-bold text-primary">Mr. Props</div>
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-primary/70">Modern Way</div>
                        </th>
                        <th className="w-1/3 border-b border-border bg-muted/20 p-6 text-center text-lg font-bold text-muted-foreground">{competitor}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row: any, i: number) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="p-6 text-lg font-medium">{row.feature}</td>
                          <td className="bg-primary/5 p-6 text-center text-base font-semibold text-foreground">{renderCell(row.primaryValue ?? '', true)}</td>
                          <td className="border-l border-border/50 bg-muted/5 p-6 text-center text-muted-foreground">{renderCell(row.secondaryValue ?? '')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {bodyHtml && <div className="prose prose-lg dark:prose-invert max-w-4xl mb-16" dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
            <div className="bg-foreground text-background rounded-3xl p-8 md:p-16 mb-24 relative overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
                <div className="space-y-6">
                  <h2 className="font-display text-3xl md:text-5xl font-bold">{sd.migrationTitle || 'Switching is instant.'}</h2>
                  <p className="text-xl text-background/80 leading-relaxed">{sd.migrationDescription || `Don't worry about your data. Our 1-click migration tool imports your listings, reviews, and future bookings from ${competitor} in seconds.`}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
                  <div className="w-full rounded-xl shadow-lg bg-white/20 aspect-[4/3]" />
                  <div className="mt-6 text-center"><Button size="lg" className="bg-white text-black hover:bg-gray-200 font-bold rounded-full w-full">{sd.migrationButtonLabel || 'Start My Import'}</Button></div>
                </div>
              </div>
            </div>
            <SEOContentSkeleton seoTitle={sd.seoTitle || data.seo_title || `Best ${competitor} Alternative | Mr. Props`} seoDescription={sd.seoDescription || data.meta_description || `Compare ${competitor} vs Mr. Props.`} slug={`/alternatives/${slug}`} mainTitle="" introText="" faqTitle="" faqs={faqs} ctaTitle={sd.ctaTitle || 'Ready to upgrade?'} ctaText={sd.ctaText} ctaButtonText={'Start Free Migration'} />
          </div>
        </div>
      </>
    );
  }

  // ─── Tax (inline) ────────────────────────────────────────────────────────
  if (fam.family === 'tax') {
    const slug = String(data.custom_slug || '').replace(/^taxes\//, '');
    const slugBits = slug.split('/');
    const platform = (slugBits[0] || 'platform').charAt(0).toUpperCase() + (slugBits[0] || 'platform').slice(1);
    const regionSlug = slugBits[1] || 'region';
    const regionName = regionSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const dates = sd.importantDates?.length ? sd.importantDates : [];
    const faqs = sd.faqs?.length ? sd.faqs : [];
    return (
      <>
        {bannerTop(verified.expiresAt)}
        <div className="min-h-screen bg-background pb-20">
          <div className="sticky top-0 z-40 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-700 dark:text-yellow-400 py-3 text-center text-sm font-medium px-4 backdrop-blur-sm"><AlertCircle className="h-4 w-4 inline-block mr-2 mb-0.5" /> {sd.alertText || 'Disclaimer: This guide is for educational purposes only. Always consult a certified tax professional.'}</div>
          <div className="container mx-auto px-4 max-w-screen-xl mt-8">
            <div className="flex items-center text-sm text-muted-foreground gap-2 mb-8 overflow-x-auto whitespace-nowrap">
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
              <Link href="/taxes" className="hover:text-primary transition-colors">Taxes</Link>
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
              <span className="text-foreground font-medium truncate">{regionName}</span>
            </div>
            <div className="grid lg:grid-cols-[1fr_350px] gap-12 mb-16 items-start">
              <div>
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-700 dark:text-green-400 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-green-500/20"><FileCheck className="h-4 w-4" /> {sd.statusLabel || 'Reviewed by CPA'}</div>
                  <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">{data.title || `Short-Term Rental Taxes in ${regionName}`}</h1>
                  <p className="text-xl text-muted-foreground">{sd.taxIntroDescription || `Everything you need to know about taxes for ${platform}.`}</p>
                </div>
                <div className="bg-primary text-primary-foreground p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-primary/20 mb-12">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center"><Download className="h-8 w-8 text-white" /></div>
                    <div>
                      <h3 className="text-2xl font-bold">{sd.taxChecklistTitle || 'The Ultimate Tax Checklist'}</h3>
                      <p className="text-white/80">{sd.taxChecklistDescription || 'Download the checklist for the latest tax year.'}</p>
                    </div>
                  </div>
                  <Button size="lg" variant="secondary" className="rounded-full font-bold whitespace-nowrap">{sd.taxChecklistButtonLabel || 'Download PDF'}</Button>
                </div>
                <div className="prose prose-lg dark:prose-invert mb-12 max-w-none font-sans">
                  {sd.taxIntroTitle && <h2 className="font-display font-bold mt-12 mb-6">{sd.taxIntroTitle}</h2>}
                  {sd.taxIntroDescription && <p className="mb-6 leading-relaxed">{sd.taxIntroDescription}</p>}
                  {bodyHtml && <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
                </div>
              </div>
              <div className="sticky top-24 space-y-8">
                {dates.length > 0 && (
                  <div className="bg-secondary/30 rounded-2xl p-6 border border-border">
                    <h3 className="font-bold text-lg mb-2">Important Dates</h3>
                    <ul className="space-y-3 text-sm mt-4">
                      {dates.map((item: any, i: number) => <li key={i} className="flex justify-between"><span>{item.label}</span><span className="font-bold">{item.value}</span></li>)}
                    </ul>
                  </div>
                )}
                <div className="bg-primary text-primary-foreground rounded-2xl p-6 border border-primary/20 shadow-xl">
                  <h3 className="font-display font-bold text-xl mb-2">{sd.sidebarCtaTitle || 'Simplify Tax Season'}</h3>
                  <p className="text-sm text-primary-foreground/90 mb-6 leading-relaxed">{sd.sidebarCtaDescription || 'Mr. Props generates tax-ready reports in one click.'}</p>
                  <Button variant="secondary" className="w-full font-bold">{sd.sidebarCtaButtonLabel || 'Try Mr. Props'}</Button>
                </div>
              </div>
            </div>
            <SEOContentSkeleton seoTitle={sd.seoTitle || data.seo_title || ''} seoDescription={sd.seoDescription || data.meta_description || ''} slug={`/taxes/${slug}`} mainTitle="" introText="" faqTitle="" faqs={faqs} ctaTitle={sd.ctaTitle || 'Simplify Your Tax Season'} ctaText={sd.ctaText || 'Sync your Airbnb account to Mr. Props and generate tax-ready reports in one click.'} ctaButtonText={sd.ctaPrimaryButton?.label} ctaButtonHref={sd.ctaPrimaryButton?.href} />
          </div>
        </div>
      </>
    );
  }

  // ─── Regulation (inline) ─────────────────────────────────────────────────
  if (fam.family === 'regulation') {
    const slug = String(data.custom_slug || '').replace(/^regulations\//, '');
    const slugBits = slug.split('/');
    const platform = (slugBits[0] || 'platform').charAt(0).toUpperCase() + (slugBits[0] || 'platform').slice(1);
    const locSlug = slugBits[1] || 'location';
    const locName = locSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const checklist = (sd.checklistItems || []) as Array<string | { label: string }>;
    const faqs = sd.faqs?.length ? sd.faqs : [];
    const strict = /new-york|san-francisco|berlin/i.test(locSlug);
    return (
      <>
        {bannerTop(verified.expiresAt)}
        <div className="min-h-screen bg-background pb-20">
          <div className="sticky top-0 z-40 bg-blue-500/10 border-b border-blue-500/20 text-blue-700 dark:text-blue-400 py-3 text-center text-sm font-medium px-4 backdrop-blur-sm"><AlertTriangle className="h-4 w-4 inline-block mr-2 mb-0.5" /> {sd.alertText || 'Legal Alert: Regulations change frequently. Verify with your local city council.'}</div>
          <div className="container mx-auto px-4 max-w-screen-xl mt-8">
            <div className="flex items-center text-sm text-muted-foreground gap-2 mb-8 overflow-x-auto whitespace-nowrap">
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
              <Link href="/regulations" className="hover:text-primary transition-colors">Regulations</Link>
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
              <span className="text-foreground font-medium truncate">{locName}</span>
            </div>
            <div className="grid lg:grid-cols-[1fr_350px] gap-12 mb-16 items-start">
              <div>
                <div className="mb-8">
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Local Regulations</div>
                  <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">{data.title || `${platform} Rules in ${locName}`}</h1>
                  <div className="flex items-center gap-4 mb-8">
                    <div className={`px-4 py-2 rounded-full font-bold text-white flex items-center gap-2 ${strict ? 'bg-red-500' : 'bg-green-500'}`}>
                      {strict ? <AlertTriangle className="h-5 w-5" /> : <CheckSquare className="h-5 w-5" />}
                      {sd.statusLabel || (strict ? 'Strict Regulations' : 'Host Friendly')}
                    </div>
                  </div>
                </div>
                <div className="prose prose-lg dark:prose-invert mb-12 max-w-none font-sans">
                  {sd.overviewTitle && <h2 id="overview" className="font-display font-bold">{sd.overviewTitle}</h2>}
                  {bodyHtml && <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
                </div>
                {checklist.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6 mb-12">
                    <h3 className="font-bold text-xl mb-4">{sd.checklistTitle || `${platform} compliance checklist for ${locName}`}</h3>
                    {checklist.map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
                        <input type="checkbox" className="h-6 w-6 mt-0.5 rounded border-primary text-primary focus:ring-primary" />
                        <label className="font-medium cursor-pointer">{typeof item === 'string' ? item : (item as any).label || ''}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="sticky top-24 space-y-8">
                <div className="bg-primary text-primary-foreground rounded-2xl p-6 border border-primary/20 shadow-xl">
                  <h3 className="font-display font-bold text-xl mb-2">{sd.sidebarCtaTitle || 'Automate Compliance'}</h3>
                  <p className="text-sm text-primary-foreground/90 mb-6 leading-relaxed">{sd.sidebarCtaDescription || "Don't risk fines. Mr. Props automatically tracks local regulations and alerts you to changes."}</p>
                  <Button variant="secondary" className="w-full font-bold shadow-lg h-12 text-primary">{sd.sidebarCtaButtonLabel || 'Start Free Trial'}</Button>
                </div>
              </div>
            </div>
            <SEOContentSkeleton seoTitle={sd.seoTitle || data.seo_title || ''} seoDescription={sd.seoDescription || data.meta_description || ''} slug={`/regulations/${slug}`} mainTitle="" introText="" faqTitle="Regulation FAQs" faqs={faqs} ctaTitle={sd.ctaTitle || 'Stay Compliant Automatically'} ctaText={sd.ctaText || 'Mr. Props monitors regulatory changes in real-time and alerts you before you get fined.'} ctaButtonText={sd.ctaPrimaryButton?.label} ctaButtonHref={sd.ctaPrimaryButton?.href} />
          </div>
        </div>
      </>
    );
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
