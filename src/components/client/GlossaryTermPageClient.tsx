"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SEOContentSkeleton } from "@/components/content/SEOContentSkeleton";
import { PortableTextContent } from "@/components/content/PortableTextContent";
import { ChevronRight, Printer, Search, Share2 } from "lucide-react";
import type { GlossaryTerm } from "@/lib/glossary";

function toGlossaryHref(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `/glossary/what-is-${normalized}`;
}

export function GlossaryTermPageClient({ term }: { term: GlossaryTerm }) {
  const pageSlug = term.slug;
  const relatedTerms = useMemo(() => term.relatedTerms || [], [term.relatedTerms]);
  const faqTitle = term.faqTitle || `Frequently Asked Questions about ${term.term}`;
  const faqs = term.faqs?.length
    ? term.faqs
    : [
        { question: `Why does ${term.term} matter?`, answer: `${term.term} helps hosts make better operating decisions and understand how performance is changing over time.` },
        { question: `How often should I review ${term.term}?`, answer: "Review it weekly for active operations and monthly for portfolio-level analysis." },
        { question: `Is ${term.term} enough on its own?`, answer: "No. Pair it with occupancy, revenue, and cost data to get the full picture." },
      ];

  return (
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
              <div className="my-8 rounded-2xl overflow-hidden shadow-lg border border-border">
                <Image
                  src={term.conceptImageUrl}
                  alt={term.conceptImageAlt || `Visual explanation of ${term.term}`}
                  width={800}
                  height={450}
                  className="w-full h-auto"
                  priority
                />
              </div>
            )}

            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl">
              <PortableTextContent blocks={term.body} />
            </div>

            <div className="flex items-center gap-4 mt-12 pt-8 border-t border-border">
              <Button variant="outline" size="sm" className="gap-2"><Share2 className="h-4 w-4" /> Share</Button>
              <Button variant="outline" size="sm" className="gap-2"><Printer className="h-4 w-4" /> Print Definition</Button>
            </div>

            <div className="mt-16 pt-12 border-t border-border">
              <SEOContentSkeleton
                seoTitle={term.seoTitle}
                seoDescription={term.seoDescription}
                slug={`/glossary/${pageSlug}`}
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
                <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-4 backdrop-blur-sm">{term.proTipBadge || "Pro Tip"}</div>
                <h3 className="font-display text-2xl font-bold mb-3 leading-tight">{term.proTipTitle || `Stop tracking ${term.term} manually.`}</h3>
                <p className="text-primary-foreground/90 text-sm mb-6 leading-relaxed">{term.proTipDescription || `Mr. Props automatically tracks ${term.term} alongside the other metrics that actually drive profit.`}</p>
                <Button variant="secondary" className="w-full font-bold shadow-lg hover:shadow-xl transition-all h-12">{term.proTipButtonLabel || "Try Mr. Props Free"}</Button>
                <p className="text-xs text-center mt-3 opacity-70">No credit card required</p>
              </div>
            </div>

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
          </aside>
        </div>
      </div>
    </div>
  );
}
