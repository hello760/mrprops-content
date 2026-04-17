// Phase 5: shared alternative page renderer. Imported by both the production
// route (/alternatives/[competitor]/page.tsx) and the draft preview route.
import { AlertCircle, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOContentSkeleton } from "@/components/content/SEOContentSkeleton";
import { PortableTextContent } from "@/components/content/PortableTextContent";
import type { DirectoryEntry } from "@/lib/content-pages";

function renderTableCell(value: any, isPrimary = false) {
  if (value === true) return <Check className={`mx-auto h-5 w-5 ${isPrimary ? 'text-green-600' : 'text-gray-400'}`} />;
  // false → dash cell is inline-rendered by production page.tsx below
  if (value === false) return null;
  return <span>{String(value ?? '')}</span>;
}

export function AlternativeView({ alternative, competitor }: { alternative: DirectoryEntry; competitor: string }) {
  const competitorName = alternative.competitorName || alternative.title.replace(/ Alternative$/i, "") || competitor.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const alternativeCards = alternative.alternativeCards?.length ? alternative.alternativeCards : [
    { title: "No Hidden Fees", description: `${competitorName} takes a % of every booking. We charge a flat monthly rate. Keep 100% of your revenue.` },
    { title: "Modern Interface", description: "Clunky dashboards slow you down. Designed for 2026. Manage your portfolio with less operational drag." },
    { title: "Better Data", description: "Limited reporting and confusing exports. Real-time financial analytics and tax-ready reports instantly." },
  ];
  const comparisonTableRows = alternative.comparisonTableRows?.length ? alternative.comparisonTableRows : [];
  const faqs = alternative.faqs?.length ? alternative.faqs : [{ question: `Why hosts are leaving ${competitorName}?`, answer: `Operators usually leave ${competitorName} when they want cleaner workflows, better visibility, and less operational drag.` }];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative pt-24 pb-20 bg-secondary/10 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 text-center max-w-6xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-1.5 rounded-full font-bold text-sm mb-8">
            <AlertCircle className="h-4 w-4" /> {alternative.heroBadge || "Stop Overpaying"}
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            {alternative.heroTitle || (
              <>
                The #1 Alternative to <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 line-through decoration-red-500 decoration-4 decoration-skip-ink-none opacity-70 mr-4">{competitorName}</span>
                <span className="text-primary">Mr. Props</span>
              </>
            )}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            {alternative.heroDescription || alternative.excerpt || `Stop paying for features you do not use. Switch from ${competitorName} to the modern standard for property management.`}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" className="rounded-full px-8 h-14 text-lg font-bold shadow-xl shadow-primary/20 w-full sm:w-auto">
              {alternative.primaryCtaLabel || `Migrate from ${competitorName} in 1 Click`}
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-lg font-bold border-2 w-full sm:w-auto">
              {alternative.secondaryCtaLabel || "See Comparison"}
            </Button>
          </div>
          <div className="relative mx-auto max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-border group">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-background z-0" />
            <div className="relative z-10 grid md:grid-cols-2">
              <div className="p-8 bg-gray-100 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border">
                <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">{competitorName} (Old Way)</div>
                <div className="w-full aspect-[4/3] relative rounded-xl overflow-hidden shadow-inner border border-gray-300 bg-slate-300" />
              </div>
              <div className="p-8 bg-background flex flex-col items-center justify-center">
                <div className="text-sm font-bold text-primary uppercase tracking-wider mb-4">Mr. Props (Modern Way)</div>
                <div className="w-full aspect-[4/3] relative rounded-xl overflow-hidden shadow-lg border border-primary/10">
                  <img src={alternative.image} className="absolute inset-0 w-full h-full object-cover" alt="New Interface" />
                </div>
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 bg-white rounded-full shadow-xl flex items-center justify-center font-black text-xl z-20 border-4 border-gray-100">VS</div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-24 max-w-screen-xl">
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {alternativeCards.map((card, i) => {
            const parts = card.description.split(/\.\s+/);
            const pain = parts[0] || card.description;
            const solution = parts.slice(1).join(". ") || card.description;
            return (
              <div key={i} className="bg-card border border-border p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                <h3 className="font-display text-2xl font-bold mb-4">{card.title}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2 text-red-500 bg-red-50 p-3 rounded-lg">
                    <X className="h-4 w-4 mt-0.5 flex-shrink-0" /><span className="font-medium">{pain}</span>
                  </div>
                  <div className="flex items-start gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" /><span className="font-medium">{solution}</span>
                  </div>
                </div>
                {card.features && card.features.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground border-t border-border pt-4">
                    {card.features.map((feat: string, fi: number) => (
                      <li key={fi} className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {comparisonTableRows.length > 0 && (
          <div id="comparison-table" className="mb-24 scroll-mt-24">
            <div className="mb-8 text-center">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">Feature-by-feature breakdown</div>
              <h2 className="mt-2 font-display text-3xl md:text-4xl font-bold">{competitorName} vs Mr. Props</h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">See exactly where {competitorName} falls short and how Mr. Props closes the gap.</p>
            </div>
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
                    <th className="w-1/3 border-b border-border bg-muted/20 p-6 text-center text-lg font-bold text-muted-foreground">{competitorName}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonTableRows.map((row, i) => (
                    <tr key={i} className="border-b border-border transition-colors hover:bg-muted/30 last:border-0">
                      <td className="p-6 text-lg font-medium">{row.feature}</td>
                      <td className="bg-primary/5 p-6 text-center text-base font-semibold text-foreground">{renderTableCell(row.primaryValue ?? "", true)}</td>
                      <td className="border-l border-border/50 bg-muted/5 p-6 text-center text-muted-foreground">{renderTableCell(row.secondaryValue ?? "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 text-center">
              <Button size="lg" className="rounded-full px-8 h-12 text-base font-bold shadow-lg shadow-primary/20">
                {alternative.primaryCtaLabel || `Switch from ${competitorName}`} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {alternative.body?.length ? (
          <div className="prose prose-lg dark:prose-invert max-w-4xl mb-16">
            <PortableTextContent blocks={alternative.body} html={alternative.bodyHtml} />
          </div>
        ) : null}

        <div className="bg-foreground text-background rounded-3xl p-8 md:p-16 mb-24 relative overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6">
              <h2 className="font-display text-3xl md:text-5xl font-bold">{alternative.migrationTitle || "Switching is instant."}</h2>
              <p className="text-xl text-background/80 leading-relaxed">{alternative.migrationDescription || `Don't worry about your data. Our 1-click migration tool imports your listings, reviews, and future bookings from ${competitorName} in seconds.`}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
              <div className="w-full rounded-xl shadow-lg bg-white/20 aspect-[4/3]" />
              <div className="mt-6 text-center">
                <Button size="lg" className="bg-white text-black hover:bg-gray-200 font-bold rounded-full w-full">{alternative.migrationButtonLabel || "Start My Import"}</Button>
              </div>
            </div>
          </div>
        </div>

        <SEOContentSkeleton
          seoTitle={alternative.seoTitle || `Best ${competitorName} Alternative | Mr. Props`}
          seoDescription={alternative.seoDescription || `Compare ${competitorName} vs Mr. Props.`}
          slug={`/alternatives/${competitor}`}
          mainTitle=""
          introText=""
          faqTitle={alternative.faqTitle}
          faqs={faqs}
          ctaTitle={alternative.ctaTitle || "Ready to upgrade?"}
          ctaText={alternative.ctaText}
          ctaButtonText={alternative.ctaPrimaryButton?.label || "Start Free Migration"}
          ctaButtonHref={alternative.ctaPrimaryButton?.href}
        />
      </div>
    </div>
  );
}
