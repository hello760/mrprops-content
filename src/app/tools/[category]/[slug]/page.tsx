import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Download, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FAQAndCTA, JsonLd, ProseBody } from "@/components/content/PageBits";
import { fetchTools, splitNestedSlug } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";
import { notFound } from "next/navigation";

export const revalidate = 3600;

function categoryLabel(category: string) {
  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateStaticParams() {
  const pages = await fetchTools();
  return pages.map((page) => {
    const [category, slug] = splitNestedSlug(page.slug, "tools", 2);
    return { category, slug };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const page = (await fetchTools()).find((item) => {
    const [c, s] = splitNestedSlug(item.slug, "tools", 2);
    return c === category && s === slug;
  });
  return buildMetadata(page?.seoTitle || "Tools", page?.seoDescription || "Tool page.", `/tools/${category}/${slug}`);
}

export default async function ToolPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const page = (await fetchTools()).find((item) => {
    const [c, s] = splitNestedSlug(item.slug, "tools", 2);
    return c === category && s === slug;
  });

  if (!page) notFound();

  const categoryName = categoryLabel(category);
  const structuredData = buildStructuredData(
    createBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Tools", path: "/tools" },
      { name: categoryName, path: `/tools/${category}` },
      { name: page.title },
    ]),
    createFaqSchema(page.faqs),
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="space-y-16 md:space-y-24">
            <div className="space-y-12">
              <div className="text-center space-y-4 max-w-3xl mx-auto">
                <div className="flex items-center justify-center text-sm text-muted-foreground gap-2 overflow-x-auto whitespace-nowrap mb-4">
                  <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
                    <Home className="h-3 w-3" /> Home
                  </Link>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  <Link href="/tools" className="hover:text-primary transition-colors">
                    Free Tools
                  </Link>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  <Link href={`/tools/${category}`} className="hover:text-primary transition-colors">
                    {categoryName}
                  </Link>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  <span className="text-foreground font-medium truncate max-w-[200px]">{page.title}</span>
                </div>

                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">{page.title}</h1>
                <p className="text-xl text-muted-foreground">{page.excerpt}</p>
              </div>

              <div className="grid lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-card shadow-xl rounded-2xl border border-border overflow-hidden">
                    <div className="p-6 md:p-8">
                      <div className="space-y-4 py-4">
                        <h3 className="text-lg font-bold text-foreground">About This Tool</h3>
                        <p className="text-muted-foreground leading-relaxed">{page.excerpt}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 relative">
                  <div className="sticky top-24 space-y-6">
                    <div className="bg-card shadow-xl rounded-2xl border border-border overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -ml-5 -mb-5 pointer-events-none" />

                      <div className="p-8 relative z-10">
                        <div className="space-y-8 text-center">
                          <div className="bg-secondary/30 rounded-2xl p-8 flex flex-col justify-center items-center text-center space-y-4 border border-primary/10 min-h-[320px]">
                            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Calculator</div>
                            <div className="text-2xl font-display font-bold text-foreground">Calculator loading...</div>
                            <p className="text-sm text-muted-foreground max-w-[240px]">
                              The interactive calculator widget will be mounted here while keeping the original SEO and content layout intact.
                            </p>
                          </div>

                          <div className="pt-8 space-y-3">
                            <Button variant="secondary" className="w-full font-bold rounded-xl gap-2 h-12 shadow-sm border border-border/50">
                              <Download className="h-4 w-4" /> Email me this detailed report
                            </Button>
                            <Button variant="default" className="w-full font-bold rounded-xl gap-2 h-12 shadow-lg shadow-primary/20" asChild>
                              <a href={page.ctaPrimaryButton?.href || "https://app.mrprops.io/register"}>
                                {page.ctaPrimaryButton?.label || "Start Free Trial"}
                              </a>
                            </Button>
                          </div>

                          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="opacity-70">
                              Based on 2026 Market Data
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-20 text-center">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-8 tracking-tight">
                  How is <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">{page.title}</span> helpful?
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                  Most hosts guess their numbers. Pros use data. This tool helps you make unemotional, data-driven decisions about your property portfolio, ensuring every dollar you invest yields a measurable return.
                </p>
              </div>

              <div className="prose prose-lg max-w-none mx-auto text-left">
                <ProseBody blocks={page.body} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <FAQAndCTA
        faqs={page.faqs}
        faqTitle={page.faqTitle}
        ctaTitle={page.ctaTitle}
        ctaText={page.ctaText}
        ctaPrimaryButton={page.ctaPrimaryButton}
        ctaSecondaryButton={page.ctaSecondaryButton}
      />
      <JsonLd data={structuredData} />
    </div>
  );
}
