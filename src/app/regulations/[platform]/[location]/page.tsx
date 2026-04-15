import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckSquare, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOContentSkeleton } from "@/components/content/SEOContentSkeleton";
import { PortableTextContent, portableTextHeadings } from "@/components/content/PortableTextContent";
import { fetchRegulations, fetchRegulationBySlug, splitNestedSlug } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const pages = await fetchRegulations();
  return pages.map((page) => {
    const [platform, location] = splitNestedSlug(page.slug, "regulations", 2);
    return { platform, location };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ platform: string; location: string }> }): Promise<Metadata> {
  const { platform, location } = await params;
  const page = await fetchRegulationBySlug(platform, location);
  return buildMetadata(page?.seoTitle || "Regulations", page?.seoDescription || "Regulation guide.", `/regulations/${platform}/${location}`);
}

export default async function RegulationPage({ params }: { params: Promise<{ platform: string; location: string }> }) {
  const { platform, location } = await params;
  const regulation = await fetchRegulationBySlug(platform, location);
  if (!regulation) notFound();

  const locName = regulation.location || location.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const platformName = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "Rental";
  const isStrict = location.includes("new-york") || location.includes("san-francisco") || location.includes("berlin");
  const contentHeadings = portableTextHeadings(regulation.body);
  const checklistItems = regulation.checklistItems?.length ? regulation.checklistItems : ["Business License Application", "Fire Safety Inspection", "Liability Insurance ($1M min)", "Neighbor Notification Form"];
  const faqs = regulation.faqs?.length ? regulation.faqs : [{ question: "Do I need a permit for 30+ day rentals?", answer: "Usually, mid-term rentals are exempt from STR laws." }, { question: "How much is the license fee?", answer: "Fees vary by market and permit class." }, { question: "Can I rent out my basement?", answer: "Only if it meets local fire code and occupancy rules." }];
  const structuredData = buildStructuredData(createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Regulations", path: "/regulations" }, { name: regulation.title }]), createFaqSchema(faqs));

  return <><div className="min-h-screen bg-background pb-20"><div className="sticky top-0 z-40 bg-blue-500/10 border-b border-blue-500/20 text-blue-700 dark:text-blue-400 py-3 text-center text-sm font-medium px-4 backdrop-blur-sm"><AlertTriangle className="h-4 w-4 inline-block mr-2 mb-0.5" /> {regulation.alertText || "Legal Alert: Regulations change frequently. Verify with your local city council."}</div><div className="container mx-auto px-4 max-w-screen-xl mt-8"><div className="flex items-center text-sm text-muted-foreground gap-2 mb-8 overflow-x-auto whitespace-nowrap"><Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link><ChevronRight className="h-4 w-4 flex-shrink-0" /><Link href="/regulations" className="hover:text-primary transition-colors">Regulations</Link><ChevronRight className="h-4 w-4 flex-shrink-0" /><Link href={`/regulations/${platform}`} className="hover:text-primary transition-colors capitalize">{platform}</Link><ChevronRight className="h-4 w-4 flex-shrink-0" /><span className="text-foreground font-medium truncate">{locName}</span></div><div className="grid lg:grid-cols-[1fr_350px] gap-12 mb-16 items-start"><div><div className="mb-8"><div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Local Regulations</div><h1 className="font-display text-4xl md:text-6xl font-bold mb-6">{regulation.title || `${platformName} Rules in ${locName}`}</h1><div className="flex items-center gap-4 mb-8"><div className={`px-4 py-2 rounded-full font-bold text-white flex items-center gap-2 ${isStrict ? "bg-red-500" : "bg-green-500"}`}>{isStrict ? <AlertTriangle className="h-5 w-5" /> : <CheckSquare className="h-5 w-5" />}{regulation.statusLabel || (isStrict ? "Strict Regulations" : "Host Friendly")}</div><div className="text-sm text-muted-foreground">Last Updated: {regulation.updated || "Oct 2025"}</div></div></div><div className="bg-secondary/20 border border-border rounded-xl p-6 mb-12"><h3 className="font-bold text-lg mb-4">{regulation.tocTitle || "Table of Contents"}</h3><ul className="space-y-2 text-sm"><li><a href="#overview" className="text-primary hover:underline">1. {regulation.overviewTitle || "Regulatory Overview"}</a></li>{contentHeadings.map((heading, index) => <li key={heading.id}><a href={`#${heading.id}`} className="text-primary hover:underline">{index + 2}. {heading.label}</a></li>)}{contentHeadings.length === 0 ? <><li><a href="#licenses" className="text-primary hover:underline">2. Licensing Requirements</a></li><li><a href="#zoning" className="text-primary hover:underline">3. Zoning Restrictions</a></li></> : null}</ul></div><div className="prose prose-lg dark:prose-invert mb-12 max-w-none font-sans"><h2 id="overview" className="font-display font-bold">1. {regulation.overviewTitle || "Regulatory Overview"}</h2><p className="lead text-xl text-muted-foreground leading-relaxed mb-8">{regulation.excerpt || `Operating a short-term rental in ${locName} requires navigating specific local laws.`}</p><PortableTextContent blocks={regulation.body} /></div><div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6 mb-12"><h3 className="font-bold text-xl mb-4">{regulation.checklistTitle || `${platformName} compliance checklist for ${locName}`}</h3>{checklistItems.map((item, i) => <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30"><input type="checkbox" className="h-6 w-6 mt-0.5 rounded border-primary text-primary focus:ring-primary" /><label className="font-medium cursor-pointer">{item}</label></div>)}</div></div><div className="sticky top-24 space-y-8"><div className="bg-primary text-primary-foreground rounded-2xl p-6 border border-primary/20 shadow-xl relative overflow-hidden group"><div className="relative z-10"><h3 className="font-display font-bold text-xl mb-2">{regulation.sidebarCtaTitle || "Automate Compliance"}</h3><p className="text-sm text-primary-foreground/90 mb-6 leading-relaxed">{regulation.sidebarCtaDescription || "Don’t risk fines. Mr. Props automatically tracks local regulations and alerts you to changes."}</p><Button variant="secondary" className="w-full font-bold shadow-lg hover:shadow-xl transition-all h-12 text-primary" asChild><a href={regulation.ctaPrimaryButton?.href || "https://app.mrprops.io/register"}>{regulation.sidebarCtaButtonLabel || "Start Free Trial"}</a></Button></div></div></div></div><SEOContentSkeleton seoTitle={regulation.seoTitle || `${platformName} Laws in ${locName} | Compliance Guide`} seoDescription={regulation.seoDescription || `Complete guide to short-term rental regulations in ${locName}.`} slug={`/regulations/${platform}/${location}`} mainTitle="" introText="" faqTitle={regulation.faqTitle || "Regulation FAQs"} faqs={faqs} ctaTitle={regulation.ctaTitle || "Stay Compliant Automatically"} ctaText={regulation.ctaText || "Mr. Props monitors regulatory changes in real-time and alerts you before you get fined."} ctaButtonText={regulation.ctaPrimaryButton?.label} ctaButtonHref={regulation.ctaPrimaryButton?.href} /></div></div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></>;
}
