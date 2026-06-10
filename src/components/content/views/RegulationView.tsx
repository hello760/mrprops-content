// Phase 5: shared regulation page renderer. Imported by both production and draft routes.
import Link from "next/link";
import { AlertTriangle, CheckSquare, ChevronRight, Home } from "lucide-react";
import { SEOContentSkeleton } from "@/components/content/SEOContentSkeleton";
import { PortableTextContent, portableTextHeadings } from "@/components/content/PortableTextContent";
import { markdownToHtml, stripRedundantBodyBlocks } from "@/lib/markdown-to-html";
import { NewsletterSidebar } from "@/components/newsletter/NewsletterSidebar";
import type { DirectoryEntry } from "@/lib/content-pages";

type ChecklistItem = string | { label?: string; checked?: boolean };

export function RegulationView({ regulation, platform, location }: { regulation: DirectoryEntry; platform: string; location: string }) {
  const locName = regulation.location || location.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const platformName = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "Rental";
  const isStrict = location.includes("new-york") || location.includes("san-francisco") || location.includes("berlin");
  // Single-checklist fix (2026-06-10): strip the body's duplicate "…Compliance
  // Checklist" section ONCE, then derive both the Table of Contents and the
  // rendered body from the stripped HTML. Deriving the TOC from the stripped
  // HTML keeps it in sync — no orphaned anchor for the removed body checklist.
  const strippedBodyHtml = stripRedundantBodyBlocks(regulation.bodyHtml);
  const contentHeadings = portableTextHeadings(regulation.body, strippedBodyHtml);
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
            <div className="bg-secondary/20 border border-border rounded-xl p-6 mb-12">
              <h3 className="font-bold text-lg mb-4">{regulation.tocTitle || "Table of Contents"}</h3>
              <ul className="space-y-2 text-sm">
                {/* Single-source TOC (2026-06-10): mirror the body's own section
                    headings 1:1. The body already carries numbered sections
                    ("1. Regulatory Overview", "2. ...") so labels render as-is with
                    no injected/index prefix. Removes the old hardcoded
                    "1. {overviewTitle}" entry (which duplicated the body's first
                    section + double-numbered the rest as "2. 1. ...") and its
                    orphaned #overview anchor. */}
                {contentHeadings.map((heading) => (
                  <li key={heading.id}><a href={`#${heading.id}`} className="text-primary hover:underline">{heading.label}</a></li>
                ))}
              </ul>
            </div>
            {/* Single-checklist fix (2026-06-10): the compliance checklist now
                renders directly under the Table of Contents (above the body prose)
                as the single interactive checklist. Real-checkbox markup + the
                length>0 gate are preserved; the duplicate body checklist is
                stripped via stripRedundantBodyBlocks (markdown-to-html Rule 10).
                CC↔Live truth (2026-05-19, Phase 4c): card is gated on CC having
                at least one checklistItems entry. */}
            {checklistItems.length > 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6 mb-12">
                <h3 className="font-bold text-xl mb-4">{regulation.checklistTitle || `${platformName} compliance checklist for ${locName}`}</h3>
                {checklistItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
                    <input type="checkbox" className="h-6 w-6 mt-0.5 rounded border-primary text-primary focus:ring-primary" />
                    <label className="font-medium cursor-pointer">{checklistLabel(item)}</label>
                  </div>
                ))}
              </div>
            ) : null}
            {/* Body is the single source of truth (2026-06-10): removed the
                hardcoded "overview teaser" — an injected `<h2>1. {overviewTitle}</h2>`
                plus the SEO meta-description excerpt — that rendered above the body.
                It duplicated the body's own first section (and on pages where
                overviewTitle was the article title, repeated the H1) and pushed the
                meta description into the visible copy. The body already begins with
                its own "1. Regulatory Overview", so it renders directly after the
                checklist. */}
            <div className="prose prose-lg dark:prose-invert mb-12 max-w-none font-sans">
              <PortableTextContent blocks={regulation.body} html={markdownToHtml(strippedBodyHtml)} />
            </div>
          </div>
          <div className="sticky top-24 space-y-8">
            {/* Uniform newsletter CTA (2026-06-10): replaced the per-page
                sidebar CTA (sidebarCtaTitle/Description/ButtonLabel — the
                machine-written "Track {Location} STR Compliance…" box that
                varied per page) with a single vertical newsletter signup that
                is IDENTICAL across every regulation page. Real subscribe wiring
                (POST /api/newsletter/subscribe) via NewsletterSidebar. The old
                sidebarCta* fields remain in structured_data but are no longer
                read here. */}
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
