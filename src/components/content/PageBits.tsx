import Link from "next/link";
import { PortableTextContent, portableTextHeadings } from "@/components/content/PortableTextContent";
import { CTA } from "@/components/sections/CTA";
import { FAQ } from "@/components/sections/FAQ";

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return <div className="flex items-center text-sm text-muted-foreground gap-2 mb-8 overflow-x-auto whitespace-nowrap">{items.map((item, index) => <div key={`${item.label}-${index}`} className="flex items-center gap-2">{index > 0 ? <span>/</span> : null}{item.href ? <Link href={item.href} className="hover:text-primary transition-colors">{item.label}</Link> : <span className="text-foreground font-medium truncate">{item.label}</span>}</div>)}</div>;
}

export function ProseBody({ blocks }: { blocks?: any[] }) {
  const headings = portableTextHeadings(blocks);
  return <div className="grid lg:grid-cols-[1fr_280px] gap-12 items-start"><div className="prose prose-lg max-w-none"><PortableTextContent blocks={blocks as any} /></div><aside className="hidden lg:block sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-sm">{headings.length ? <><h3 className="font-bold text-lg mb-4">On this page</h3><ul className="space-y-3 text-sm">{headings.map((heading) => <li key={heading.id}><a href={`#${heading.id}`} className="text-muted-foreground hover:text-primary transition-colors">{heading.label}</a></li>)}</ul></> : <p className="text-sm text-muted-foreground">Scroll for the full guide.</p>}</aside></div>;
}

export function FAQAndCTA({ faqs, faqTitle, ctaTitle, ctaText, ctaPrimaryButton, ctaSecondaryButton }: { faqs?: Array<{ question: string; answer: string }>; faqTitle?: string; ctaTitle?: string; ctaText?: string; ctaPrimaryButton?: { label: string; href?: string }; ctaSecondaryButton?: { label: string; href?: string } }) {
  return <>{faqs?.length ? <FAQ title={faqTitle || "Frequently Asked Questions"} items={faqs} /> : null}<CTA title={ctaTitle} text={ctaText} primaryButton={ctaPrimaryButton} secondaryButton={ctaSecondaryButton} /></>;
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
