// Phase 5 C-1: Draft preview route.
// Renders a content piece by id (not slug), WITHOUT ISR caching, WITHOUT static
// generation. Gated by a short-lived HMAC token from the admin side. Invalid/
// expired tokens return 404 (not 401) so the route does not leak existence.
//
// Pilot scope: glossary only. Other families render a placeholder that notes
// "preview not yet supported for this family."
//
// This route does NOT appear in generateStaticParams anywhere — it's dynamic.
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Printer, Search, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOContentSkeleton } from '@/components/content/SEOContentSkeleton';
import { fetchGlossaryTermById, fetchPieceFamilyById } from '@/lib/glossary';
import { verifyDraftToken } from '@/lib/verifyDraftToken';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  const family = await fetchPieceFamilyById(id);
  if (!family) notFound();

  if (family.family === 'glossary') {
    const term = await fetchGlossaryTermById(id);
    if (!term) notFound();
    const relatedTerms = term.relatedTerms?.length ? term.relatedTerms : [];
    const faqs = term.faqs?.length ? term.faqs : [];
    const faqTitle = term.faqTitle || `Frequently Asked Questions about ${term.term}`;

    return (
      <>
        <div className="sticky top-0 z-50 bg-amber-500/90 text-amber-950 text-xs font-bold uppercase tracking-wider py-2 text-center">
          ⚠ DRAFT PREVIEW — not indexed, not cached. Token expires {new Date(verified.expiresAt * 1000).toLocaleTimeString()}.
        </div>
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
                    <Image
                      src={term.conceptImageUrl}
                      alt={term.conceptImageAlt || `Visual explanation of ${term.term}`}
                      width={800}
                      height={450}
                      className="w-full object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl">
                  {term.bodyHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: term.bodyHtml }} />
                  ) : (
                    <div className="text-muted-foreground italic">(body content missing — regenerate the article to populate)</div>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-12 pt-8 border-t border-border">
                  <Button variant="outline" size="sm" className="gap-2"><Share2 className="h-4 w-4" /> Share</Button>
                  <Button variant="outline" size="sm" className="gap-2"><Printer className="h-4 w-4" /> Print Definition</Button>
                </div>
                <div className="mt-16 pt-12 border-t border-border">
                  <SEOContentSkeleton
                    seoTitle={term.seoTitle}
                    seoDescription={term.seoDescription}
                    slug={`/glossary/${term.slug}`}
                    mainTitle=""
                    introText=""
                    faqTitle={faqTitle}
                    faqs={faqs}
                    ctaTitle={term.ctaTitle}
                    ctaText={term.ctaText}
                    ctaButtonText={term.ctaPrimaryButton?.label}
                    ctaButtonHref={term.ctaPrimaryButton?.href}
                  />
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
                {relatedTerms.length > 0 && (
                  <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                    <div className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Related Terms</div>
                    <ul className="space-y-3">
                      {relatedTerms.map((related) => (
                        <li key={related}>
                          <Link href={toGlossaryHref(related)} className="group flex items-center justify-between text-foreground hover:text-primary transition-colors cursor-pointer text-sm font-medium py-1">
                            <span>{related}</span>
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

  // Other families: placeholder until pilot expansion lands them.
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md p-8 text-center">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Draft preview</div>
        <h1 className="text-2xl font-bold mb-3">Family: {family.family || 'unknown'}</h1>
        <p className="text-muted-foreground">
          Preview renderer for the <code>{family.family}</code> family lands after the glossary pilot is verified. See Phase 5 §6 for expansion order.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">Token expires {new Date(verified.expiresAt * 1000).toLocaleTimeString()}.</p>
      </div>
    </div>
  );
}

// Prevent Next.js from indexing this path and keep it out of sitemaps.
export const metadata = {
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
  title: 'Draft preview — Mr. Props admin',
};
