// Phase 5: shared regulation page renderer. Imported by both production and draft routes.
import Link from "next/link";
import { AlertTriangle, CheckSquare, ChevronRight, Home } from "lucide-react";
import { SEOContentSkeleton } from "@/components/content/SEOContentSkeleton";
import { NewsletterSidebar } from "@/components/newsletter/NewsletterSidebar";
import { PortableTextContent, portableTextHeadings, headingId } from "@/components/content/PortableTextContent";
import { markdownToHtml, stripRedundantBodyBlocks, extractComplianceChecklistSection, firstHeadingText } from "@/lib/markdown-to-html";
import type { DirectoryEntry } from "@/lib/content-pages";

type ChecklistItem = string | { label?: string; checked?: boolean };

export function RegulationView({ regulation, platform, location }: { regulation: DirectoryEntry; platform: string; location: string }) {
  const locName = regulation.location || location.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const platformName = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "Rental";
  const isStrict = location.includes("new-york") || location.includes("san-francisco") || location.includes("berlin");
  // Relocate the detailed body checklist to the page bottom (opt-in strip: only
  // RegulationView re-renders it, so only RegulationView passes the flag — other
  // stripRedundantBodyBlocks consumers are untouched). Strip once; derive both the
  // TOC and the rendered body from the stripped HTML.
  const strippedBodyHtml = stripRedundantBodyBlocks(regulation.bodyHtml, { relocateComplianceChecklist: true });
  const contentHeadings = portableTextHeadings(regulation.body, strippedBodyHtml);
  const detailedChecklistHtml = extractComplianceChecklistSection(regulation.bodyHtml);
  const detailedChecklistHeading = firstHeadingText(detailedChecklistHtml);
  const detailedChecklistId = detailedChecklistHeading ? headingId(detailedChecklistHeading) : "";
  // CC↔Live truth fix (2026-05-19, Phase 4c): drop hardcoded checklistItems +
  // faqs fallbacks. Was injecting 4 generic checklist items ("Business License
  // Application" etc.) + 3 generic FAQs ("Do I need a permit for 30+ day rentals?"
  // etc.) whenever CC fields were empty — none of which the operator could see
  // or edit. Mirrors Phase 2 glossary fix + PR #36 ToolPageClient.
  const checklistItems: ChecklistItem[] = regulation.checklistItems?.length ? regulation.checklistItems : [];
  const faqs = regulation.faqs?.length ? regulation.faqs : [];
  const checklistLabel = (item: ChecklistItem): string => typeof item === "string" ? item : (item.label || "");

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-blue-500/10 border-b border-blue-500/20 text-blue-700 dark:text-blue-400 py-3 text-center text-sm font-medium px-4 backdrop-blur-sm">
        <AlertTriangle className="h-4 w-4 inline-block mr-2 mb-0.5" /> {regulation.alertText || "Legal Alert: Regulations change frequently. Verify with your local city council."}
      </div>
      <div className="container mx-auto px-4 max-w-screen-xl mt-8">
        <div className="flex items-center text-sm text-muted-foreground gap-2 mb-8 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <Link href="/regulations" className="hover:text-primary transition-colors">Regulations</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <Link href={`/regulations/${platform}`} className="hover:text-primary transition-colors capitalize">{platform}</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-foreground font-medium truncate">{locName}</span>
        </div>
        <div className="grid lg:grid-cols-[1fr_350px] gap-12 mb-16 items-start">
          <div>
            <div className="mb-8">
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Local Regulations</div>
              <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">{regulation.title || `${platformName} Rules in ${locName}`}</h1>
              <div className="flex items-center gap-4 mb-8">
                <div className={`px-4 py-2 rounded-full font-bold text-white flex items-center gap-2 ${isStrict ? "bg-red-500" : "bg-green-500"}`}>
                  {isStrict ? <AlertTriangle className="h-5 w-5" /> : <CheckSquare className="h-5 w-5" />}
                  {regulation.statusLabel || (isStrict ? "Strict Regulations" : "Host Friendly")}
                </div>
                {/* FIX-007 (PF-07): removed 'Last Updated: …' badge. PDF regulation spec + universal
                    rule: 'Last Updated' timestamps do not belong in body. Metadata (piece.updatedAt)
                    is still available to CMS/structured-data consumers. */}
              </div>
            </div>
            {/* FIX-CCX (2026-06-10, Sentry MMG-COMMAND-CENTER-X/-Q): TOC mirrors body headings
                VERBATIM — no hardcoded first item, no re-numbering. FIX-027's string-match dedup
                failed in production because body headings carry their own "N." prefix
                ("1. Regulatory Overview" != "Regulatory Overview"), so the hardcoded item
                duplicated on all published regulation pages. Body (CC) is the single source
                of truth; labels render as-authored. Card gated on having >=1 heading
                (mirrors TaxView Phase 4c gating). */}
            {contentHeadings.length > 0 ? (
              <div className="bg-secondary/20 border border-border rounded-xl p-6 mb-12">
                <h3 className="font-bold text-lg mb-4">{regulation.tocTitle || "Table of Contents"}</h3>
                <ul className="space-y-2 text-sm">
                  {contentHeadings.map((heading) => (
                    <li key={heading.id}><a href={`#${heading.id}`} className="text-primary hover:underline">{heading.label}</a></li>
                  ))}
                  {/* Relocated detailed checklist (bottom of page, after Disclaimer):
                      listed in the TOC like any other section, linked to its anchor. */}
                  {detailedChecklistHeading ? (
                    <li key="detailed-checklist"><a href={`#${detailedChecklistId}`} className="text-primary hover:underline">{detailedChecklistHeading}</a></li>
                  ) : null}
                </ul>
              </div>
            ) : null}
            {/* Single interactive checklist (2026-06-11): the short, clickable
                structured_data checklist card renders directly under the Table of
                Contents (above the body). Real <input type=checkbox>; gated on CC
                having >=1 checklistItems entry. shrink-0 keeps every box 24x24 even
                when the label wraps. */}
            {checklistItems.length > 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6 mb-12">
                <h3 className="font-bold text-xl mb-4">{regulation.checklistTitle || `${platformName} compliance checklist for ${locName}`}</h3>
                {checklistItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
                    <input type="checkbox" className="h-6 w-6 shrink-0 mt-0.5 rounded border-primary text-primary focus:ring-primary" />
                    <label className="font-medium cursor-pointer">{checklistLabel(item)}</label>
                  </div>
                ))}
              </div>
            ) : null}
            {/* FIX-CCX (2026-06-10, Sentry MMG-COMMAND-CENTER-X/-Q): removed the hardcoded
                "1. {overviewTitle}" teaser H2 + excerpt (meta description) injection entirely.
                It rendered operator-invisible content (the phantom H2 with the SEO description
                as body) on every page whose first H2 didn't string-match overviewTitle — which
                was ALL published regulation pages, because body headings carry "N." prefixes.
                Body (CC) is the single source of truth; bodyHtml still pipes through
                markdownToHtml (FIX-020) + stripRedundantBodyBlocks. Mirrors TaxView FIX-022. */}
            <div className="prose prose-lg dark:prose-invert mb-12 max-w-none font-sans">
              <PortableTextContent blocks={regulation.body} html={markdownToHtml(strippedBodyHtml)} />
            </div>
            {/* Detailed checklist at the bottom (2026-06-11): the rich body
                checklist (non-interactive ☐ reference list, as on every live page)
                renders HERE — after the article body (Disclaimer) and before the
                FAQ accordion below the grid. The short interactive structured_data
                card is moved up under the TOC. Both checklists are kept; they just
                sit in different places. */}
            {detailedChecklistHtml ? (
              <div id={detailedChecklistId || undefined} className="prose prose-lg dark:prose-invert max-w-none font-sans border-t border-border pt-10 mb-4 scroll-mt-24">
                <PortableTextContent html={markdownToHtml(detailedChecklistHtml)} />
              </div>
            ) : null}
          </div>
          <div className="sticky top-24 space-y-8">
            {/* Uniform newsletter CTA (2026-06-16): replaced the per-page
                sidebarCta* card (machine-written "Track {Location} STR
                Compliance…", different on every page) with a single vertical
                newsletter signup identical across all regulation pages. Real
                subscribe wiring via NewsletterSidebar. sidebarCta* fields remain
                in structured_data but are no longer read here. */}
            <NewsletterSidebar source="regulations_sidebar" />
          </div>
        </div>
        {/* CC↔Live truth fix (2026-05-19, Phase 4c): drop hardcoded fallbacks
            for seoTitle/seoDescription/faqTitle/ctaTitle/ctaText. Pass
            undefined when CC has nothing; SEOContentSkeleton + SEO meta
            handle their own sensible defaults (or hide the CTA section
            entirely when ctaTitle is undefined). */}
        <SEOContentSkeleton
          seoTitle={regulation.seoTitle || `${platformName} Laws in ${locName} | Compliance Guide`}
          seoDescription={regulation.seoDescription || `Complete guide to short-term rental regulations in ${locName}.`}
          slug={`/regulations/${platform}/${location}`}
          mainTitle=""
          introText=""
          faqTitle={regulation.faqTitle}
          faqs={faqs}
          ctaTitle={regulation.ctaTitle}
          ctaText={regulation.ctaText}
          ctaButtonText={regulation.ctaPrimaryButton?.label}
          ctaButtonHref={regulation.ctaPrimaryButton?.href}
        />
      </div>
    </div>
  );
}
