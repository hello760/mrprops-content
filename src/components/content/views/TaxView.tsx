// Phase 5: shared tax page renderer. Imported by both production and draft routes.
import Link from "next/link";
import { AlertCircle, Calculator, ChevronRight, Download, FileCheck, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOContentSkeleton } from "@/components/content/SEOContentSkeleton";
import { PortableTextContent } from "@/components/content/PortableTextContent";
import { markdownToHtml, stripRedundantBodyBlocks } from "@/lib/markdown-to-html";
import type { DirectoryEntry } from "@/lib/content-pages";

export function TaxView({ taxPage, platform, region }: { taxPage: DirectoryEntry; platform: string; region: string }) {
  const regionName = taxPage.location || region.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const platformName = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "Platform";
  // CC↔Live truth fix (2026-05-19, Phase 4c): drop hardcoded importantDates +
  // faqs fallbacks. Was injecting fake "Q1 Payment April 15", "Q2 Payment
  // June 15", "Q3 Payment Sept 15" + 3 generic tax FAQs whenever CC fields
  // were empty. Operator couldn't see or edit any of it. Mirrors Phase 2
  // glossary fix + PR #36 ToolPageClient fix.
  const importantDates = taxPage.importantDates?.length ? taxPage.importantDates : [];
  const faqs = taxPage.faqs?.length ? taxPage.faqs : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Alert disclaimer — universal legal chrome (operator can override via taxPage.alertText). */}
      <div className="sticky top-0 z-40 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-700 dark:text-yellow-400 py-3 text-center text-sm font-medium px-4 backdrop-blur-sm">
        <AlertCircle className="h-4 w-4 inline-block mr-2 mb-0.5" /> {taxPage.alertText || "Disclaimer: This guide is for educational purposes only. Always consult a certified tax professional."}
      </div>
      <div className="container mx-auto px-4 max-w-screen-xl mt-8">
        <div className="flex items-center text-sm text-muted-foreground gap-2 mb-8 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <Link href="/taxes" className="hover:text-primary transition-colors">Taxes</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <Link href={`/taxes/${platform}`} className="hover:text-primary transition-colors capitalize">{platform}</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-foreground font-medium truncate">{regionName}</span>
        </div>
        <div className="grid lg:grid-cols-[1fr_350px] gap-12 mb-16 items-start">
          <div>
            <div className="mb-8">
              {/* FIX-009 (PF-09): removed 'Reviewed by CPA' default badge — per PDF universal rule banning
                  'Reviewed by' labels in body. If a piece explicitly sets taxPage.reviewedBadge, it still renders. */}
              {taxPage.reviewedBadge ? (
                <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-700 dark:text-green-400 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-green-500/20">
                  <FileCheck className="h-4 w-4" /> {taxPage.reviewedBadge}
                </div>
              ) : null}
              {/* Phase 4c (2026-05-19): title/excerpt fall back to URL-derived defaults
                  ONLY for hero rendering. These are deterministic from URL params
                  (regionName + platformName), so operators see them in CC as the page slug.
                  Strict drop would leave hero empty for any piece without an explicit title. */}
              <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">{taxPage.title || `Short-Term Rental Taxes in ${regionName}`}</h1>
              {taxPage.excerpt ? (
                <p className="text-xl text-muted-foreground">{taxPage.excerpt}</p>
              ) : null}
            </div>
            {/* Table of Contents — gated on having at least one CC-populated section name.
                Phase 4c: dropped hardcoded "Reporting Rental Income" / "Occupancy Taxes (TOT)" /
                "Top Deductions for Hosts" defaults so the TOC reflects only what's in CC. */}
            {(taxPage.taxIntroTitle || taxPage.taxOccupancyTitle) ? (
              <div className="bg-secondary/20 border border-border rounded-xl p-6 mb-12">
                <h3 className="font-bold text-lg mb-4">{taxPage.tocTitle || "Table of Contents"}</h3>
                <ul className="space-y-2 text-sm">
                  {taxPage.taxIntroTitle ? (
                    <li><a href="#income" className="text-primary hover:underline">{taxPage.taxIntroTitle}</a></li>
                  ) : null}
                  {taxPage.taxOccupancyTitle ? (
                    <li><a href="#occupancy" className="text-primary hover:underline">{taxPage.taxOccupancyTitle}</a></li>
                  ) : null}
                </ul>
              </div>
            ) : null}
            {/* Checklist CTA card — Phase 4c: gate entire card on CC field presence.
                Was rendering "The Ultimate Tax Checklist / Don't miss a deduction. Updated for 2025."
                + "Download PDF" button whenever CC had nothing — operator-invisible content. */}
            {taxPage.taxChecklistTitle ? (
              <div className="bg-primary text-primary-foreground p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-primary/20 mb-12">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Download className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{taxPage.taxChecklistTitle}</h3>
                    {taxPage.taxChecklistDescription ? (
                      <p className="text-white/80">{taxPage.taxChecklistDescription}</p>
                    ) : null}
                  </div>
                </div>
                {taxPage.taxChecklistButtonLabel ? (
                  <Button size="lg" variant="secondary" className="rounded-full font-bold whitespace-nowrap">{taxPage.taxChecklistButtonLabel}</Button>
                ) : null}
              </div>
            ) : null}
            {/* FIX-022 (PF-22 cluster A): removed the two short teaser H2s (taxIntroTitle + taxOccupancyTitle)
                that duplicated the deeper H2s inside bodyHtml. The PortableTextContent below is now the single
                body source. bodyHtml is piped through markdownToHtml to close FIX-020 (PF-20 markdown leak). */}
            <div className="prose prose-lg dark:prose-invert mb-12 max-w-none font-sans">
              <PortableTextContent blocks={taxPage.body} html={markdownToHtml(stripRedundantBodyBlocks(taxPage.bodyHtml))} />
            </div>
          </div>
          <div className="sticky top-24 space-y-8">
            {/* Tax Estimator card — Phase 4c: gate on CC calculatorTitle presence.
                Was rendering "Tax Estimator / Estimate your tax liability based on
                projected revenue." + "Open Calculator" button when CC had nothing. */}
            {taxPage.calculatorTitle ? (
              <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div className="font-bold">{taxPage.calculatorTitle}</div>
                </div>
                {taxPage.calculatorDescription ? (
                  <p className="text-sm text-muted-foreground mb-4">{taxPage.calculatorDescription}</p>
                ) : null}
                <Button className="w-full font-bold" variant="outline">{taxPage.calculatorButtonLabel || "Open Calculator"}</Button>
              </div>
            ) : null}
            {/* Important Dates — Phase 4c: gate sidebar block on at least one
                CC-populated importantDates entry. Was rendering fake Q1/Q2/Q3
                payment placeholders whenever CC array was empty. */}
            {importantDates.length > 0 ? (
              <div className="bg-secondary/30 rounded-2xl p-6 border border-border">
                <h3 className="font-bold text-lg mb-2">{taxPage.importantDatesTitle || "Important Dates"}</h3>
                <ul className="space-y-3 text-sm mt-4">
                  {importantDates.map((item, index) => (
                    <li key={index} className="flex justify-between"><span>{item.label}</span><span className="font-bold">{item.value}</span></li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
        <SEOContentSkeleton
          seoTitle={taxPage.seoTitle || `${regionName} Airbnb Tax Guide | Mr. Props`}
          seoDescription={taxPage.seoDescription || `Tax requirements for hosts in ${regionName}.`}
          slug={`/taxes/${platform}/${region}`}
          mainTitle=""
          introText=""
          faqTitle={taxPage.faqTitle}
          faqs={faqs}
          ctaTitle={taxPage.ctaTitle}
          ctaText={taxPage.ctaText}
          ctaButtonText={taxPage.ctaPrimaryButton?.label}
          ctaButtonHref={taxPage.ctaPrimaryButton?.href}
        />
      </div>
    </div>
  );
}
