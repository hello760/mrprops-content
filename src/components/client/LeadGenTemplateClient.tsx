"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PortableTextContent } from "@/components/content/PortableTextContent";
import { markdownToHtml, stripRedundantBodyBlocks } from "@/lib/markdown-to-html";
import { Lock, FileText, CheckCircle2, Home, ChevronRight, Download, X, Check } from "lucide-react";
import type { TemplatePageContent } from "@/lib/template-tools";

type TemplatePage = TemplatePageContent;

export function LeadGenTemplateClient({ page }: { page: TemplatePage }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2026-04-22: honest-UX fallback. The prior version showed
  // `alert("Template sent to ${email}")` when templateFile.url was missing,
  // which lied to the user — no file was ever produced or emailed. Published
  // templates MUST have a real file attached (the publish gate now enforces
  // this via normalizeFamily in market-me-good/src/lib/tool-config-validator.ts,
  // and a backfill script populates any legacy rows). For the download to
  // happen, templateFile.url must be present. If we ever render in a
  // half-baked state anyway (legacy row that missed the backfill), the form
  // below is disabled by `hasTemplateFile` and shows an honest "being
  // prepared" state rather than fake-deliver.
  const hasTemplateFile = Boolean(page.templateFile?.url);
  const handleDownload = (e: React.FormEvent) => {
    e.preventDefault();
    const fileUrl = page.templateFile?.url;
    if (!fileUrl) return; // form should be disabled; defensive no-op
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = page.templateFile?.fileName || "";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setEmail("");
    }, 1200);
  };

  const categoryName = page.category.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const trustItems = page.trustItems || [];
  const previewBody = page.previewBody || [];
  const useCases = page.useCases || [];
  const resources = page.resources || [];
  const faqs = page.faqs || [];

  const deduplicatedBody = useMemo(() => {
    if (!page.body?.length || !previewBody?.length) return page.body || [];
    const firstH2Idx = page.body.findIndex((b: any) => b.style === "h2");
    if (firstH2Idx === -1) return page.body;
    const h2Text = (page.body[firstH2Idx] as any).children?.map((c: any) => c.text).join("").toLowerCase().trim();
    if (!h2Text) return page.body;
    const previewH2s = previewBody
      .filter((b: any) => b.style === "h2")
      .map((b: any) => (b.children?.map((c: any) => c.text).join("") || "").toLowerCase().trim());
    if (previewH2s.some((ph: string) => ph === h2Text || ph.includes(h2Text.substring(0, 20)) || h2Text.includes(ph.substring(0, 20)))) {
      return [...page.body.slice(0, firstH2Idx), ...page.body.slice(firstH2Idx + 1)];
    }
    return page.body;
  }, [page.body, previewBody]);

  return (
    <div className="min-h-screen bg-secondary/30 pt-4 md:pt-8 pb-20">
      <div className="container mx-auto px-4 max-w-screen-xl">
        <div className="flex items-center text-sm text-muted-foreground gap-2 mb-8 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <Link href="/templates" className="hover:text-primary transition-colors">Templates</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <Link href={`/templates/${page.category}`} className="hover:text-primary transition-colors capitalize">{categoryName}</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{page.title}</span>
        </div>

        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4 text-primary bg-primary/10 border-primary/20">{page.badge}</Badge>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 text-foreground">{page.title}</h1>
          <p className="text-xl text-muted-foreground mb-8">{page.description}</p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-muted-foreground">
            {trustItems.map((item) => (
              <div key={item} className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border border-border shadow-sm"><span>{item}</span></div>
            ))}
          </div>
        </div>

        {/* FIX-HERO-IMG (2026-04-20): hero image rendered above the preview card.
            Sourced from structured_data.featuredImage via template-tools.ts normalizer.
            Renders only when populated — pieces without images generated still look
            clean because the preview card remains the primary visual. */}
        {page.heroImage && (
          <div className="max-w-4xl mx-auto mb-12 px-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.heroImage}
              alt={page.heroImageAlt || page.title}
              className="w-full h-auto rounded-2xl shadow-lg border border-border/50"
              loading="eager"
            />
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_350px] gap-12 items-start max-w-6xl mx-auto">
          <div className="space-y-12">
            <div className="relative w-full mx-auto bg-white dark:bg-card border border-border/50 shadow-2xl rounded-sm overflow-hidden min-h-[900px] md:p-12 p-6">
              <div className="mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
                <div className="font-serif text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{page.previewTitle}</div>
                <div className="text-gray-500 font-mono text-sm uppercase tracking-wider">{page.previewMeta}</div>
              </div>

              <div className="font-serif text-lg leading-relaxed text-gray-800 dark:text-gray-300 space-y-6">
                <PortableTextContent blocks={previewBody} />
              </div>

              <div className="absolute inset-0 top-0 bg-gradient-to-b from-transparent from-60% via-white/90 to-white dark:from-transparent dark:from-60% dark:via-card/95 dark:to-card z-10 flex items-end justify-center pb-20">
                <div className="w-full max-w-md bg-background/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-10 duration-700">
                  <div className="h-14 w-14 bg-primary rounded-2xl rotate-3 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30"><Lock className="h-7 w-7 text-primary-foreground" /></div>
                  <h3 className="font-display font-bold text-2xl mb-2">{page.gateTitle}</h3>
                  <p className="text-muted-foreground mb-6">{page.gateDescription}</p>

                  {hasTemplateFile ? (
                    <>
                      <form onSubmit={handleDownload} className="space-y-3">
                        <Input type="email" placeholder={page.formPlaceholder} className="h-12 bg-background/50 border-primary/20 focus:border-primary text-lg" required value={email} onChange={(e) => setEmail(e.target.value)} />
                        <Button size="lg" className="w-full h-12 font-bold text-lg shadow-lg shadow-primary/20" disabled={isSubmitting}>{isSubmitting ? "Sending..." : page.formButtonLabel}</Button>
                      </form>
                      <p className="text-xs text-muted-foreground mt-4">{page.formDisclaimer}</p>
                    </>
                  ) : (
                    /* Honest-UX fallback — shown only for legacy rows where the
                       publish gate didn't catch the missing file. The new
                       backfill script + pre-publish gate (market-me-good
                       src/lib/tool-config-validator.ts) means this branch
                       should almost never render going forward. */
                    <div className="space-y-3">
                      <Button size="lg" disabled className="w-full h-12 font-bold text-lg opacity-60 cursor-not-allowed">Template is being prepared</Button>
                      <p className="text-xs text-muted-foreground">This template is not yet available for download. Please check back shortly — our team is finalizing it.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-12 max-w-4xl mx-auto pt-12">
              {/* FIX-022 leftover: pipe bodyHtml through the same strip/markdown transform applied
                  to Tax/Regulation/Guide views. Strips inline FAQ blocks + author bylines + stray H1s +
                  Last Updated paragraphs, and converts **bold** markdown to <strong> HTML. */}
              {page.bodyHtml ? (
                <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-a:text-primary prose-img:rounded-xl prose-li:marker:text-primary"
                     dangerouslySetInnerHTML={{ __html: markdownToHtml(stripRedundantBodyBlocks(page.bodyHtml)) }} />
              ) : deduplicatedBody?.length ? (
                <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-a:text-primary prose-img:rounded-xl prose-li:marker:text-primary">
                  <PortableTextContent blocks={deduplicatedBody} html={page.bodyHtml} />
                </div>
              ) : (
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {page.whatIsTitle && <><h2 className="font-display font-bold text-3xl mb-6">{page.whatIsTitle}</h2><p className="lead">{page.whatIsText}</p></>}
                  {useCases.length > 0 && (
                    <>
                      <h2 className="font-display font-bold text-3xl mb-6 mt-12">{page.useCasesTitle}</h2>
                      <ul className="grid md:grid-cols-2 gap-4 not-prose mt-6">
                        {useCases.map((item) => (
                          <li key={item} className="flex items-center gap-3 bg-card p-4 rounded-lg border border-border shadow-sm"><CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" /><span className="font-medium">{item}</span></li>
                        ))}
                      </ul>
                    </>
                  )}
                  {page.customizeTitle && <><h2 className="font-display font-bold text-3xl mb-6 mt-12">{page.customizeTitle}</h2><p>{page.customizeText}</p></>}
                </div>
              )}

              {/* FIX-010 (PF-10): Best Practices — numbered implementation steps per PDF §6. */}
              {page.bestPractices && page.bestPractices.length > 0 && (
                <div className="not-prose">
                  <h2 className="font-display font-bold text-3xl mb-6 mt-12">Best Practices for Implementation</h2>
                  <ol className="space-y-3 list-decimal list-outside ml-5 marker:text-primary marker:font-bold">
                    {page.bestPractices.map((item, i) => (
                      <li key={i} className="pl-2 leading-relaxed text-foreground">{item}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* FIX-010: Common Mistakes — parallel Don't / Do lists per PDF §7. */}
              {page.commonMistakes && (page.commonMistakes.dontList?.length || page.commonMistakes.doList?.length) && (
                <div className="not-prose grid md:grid-cols-2 gap-6">
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/30 rounded-2xl p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><X className="h-5 w-5 text-orange-600" /> Don&apos;t</h3>
                    <ul className="space-y-3 text-sm">
                      {page.commonMistakes.dontList.map((item, i) => (
                        <li key={i} className="flex gap-2"><span className="text-orange-500 flex-shrink-0">•</span><span>{item}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 rounded-2xl p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Check className="h-5 w-5 text-emerald-600" /> Do</h3>
                    <ul className="space-y-3 text-sm">
                      {page.commonMistakes.doList.map((item, i) => (
                        <li key={i} className="flex gap-2"><span className="text-emerald-500 flex-shrink-0">•</span><span>{item}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* FIX-010: Brief Closing — declarative title + 3-5 sentences per PDF §9 (NOT "Conclusion"). */}
              {page.briefClosing?.title && page.briefClosing?.body && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 mt-12">
                  <h2 className="font-display font-bold text-2xl md:text-3xl mb-4">{page.briefClosing.title}</h2>
                  <p className="text-muted-foreground leading-relaxed">{page.briefClosing.body}</p>
                </div>
              )}

              <div className="bg-transparent mt-12">
                <h2 className="font-display font-bold text-3xl mb-8">{page.faqTitle}</h2>
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={faq.question} value={`item-${index}`} className="border border-border bg-card rounded-xl px-6">
                      <AccordionTrigger className="font-display font-semibold text-lg hover:text-primary hover:no-underline py-6">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </div>

          <div className="hidden lg:block sticky top-24 space-y-6">
            <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
              <h3 className="font-bold text-lg mb-4">{page.resourcesTitle}</h3>
              <div className="space-y-4">
                {resources.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group mb-2">
                      <FileText className="h-5 w-5 text-primary mt-0.5 group-hover:scale-110 transition-transform" />
                      <div><div className="font-medium text-sm group-hover:text-primary transition-colors">{item.label}</div><div className="text-xs text-muted-foreground">{item.meta || "Open"}</div></div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/templates"><Button variant="outline" className="w-full mt-6 font-bold">View All Templates</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
