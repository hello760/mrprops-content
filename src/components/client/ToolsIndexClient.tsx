"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, ChevronRight, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DirectoryEntry } from "@/lib/content-pages";

type ToolCard = DirectoryEntry & { href: string; category: string };

export function ToolsIndexClient({
  tools,
  initialCategory = "all",
}: {
  tools: ToolCard[];
  initialCategory?: string;
}) {
  const activeCategory = initialCategory;

  const dynamicCategories = useMemo(() => {
    const set = new Set<string>();
    tools.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [tools]);

  const categories = useMemo(() => {
    const labelize = (slug: string) =>
      slug
        .split("-")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
    return [
      { id: "all", label: "All Tools" },
      ...dynamicCategories.map((id) => ({ id, label: labelize(id) })),
    ];
  }, [dynamicCategories]);

  const headerLabel =
    categories.find((c) => c.id === activeCategory)?.label ?? "All Tools";
  const pageTitle =
    activeCategory === "all"
      ? "Free Property Management Tools"
      : `${headerLabel} Calculators`;

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-in slide-in-from-bottom-5 duration-700">
          <div className="flex items-center justify-center text-sm text-muted-foreground gap-2 overflow-x-auto whitespace-nowrap mb-6">
            <Link
              href="/"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <Home className="h-3 w-3" /> Home
            </Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <Link
              href="/tools"
              className={cn(
                "hover:text-primary transition-colors",
                activeCategory === "all" ? "text-foreground font-medium" : "",
              )}
            >
              Free Tools
            </Link>
            {activeCategory !== "all" && (
              <>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                <span className="text-foreground font-medium">
                  {headerLabel}
                </span>
              </>
            )}
          </div>

          <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 text-sm font-bold uppercase tracking-wider">
            Free Resources
          </Badge>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
            {pageTitle}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Calculators and templates to run your portfolio better.
            Professional-grade tools, completely free.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-16">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.id === "all" ? "/tools" : `/tools/${cat.id}`}
            >
              <Button
                variant={activeCategory === cat.id ? "default" : "outline"}
                className={cn(
                  "rounded-full px-6 h-10 font-bold transition-all",
                  activeCategory === cat.id
                    ? "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
                    : "bg-background text-muted-foreground hover:text-foreground border-border hover:border-primary/50",
                )}
              >
                {cat.label}
              </Button>
            </Link>
          ))}
        </div>

        {tools.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Calculator className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No tools found</h3>
            <p className="text-muted-foreground">
              We haven&apos;t added tools to this category yet.
            </p>
            <Link href="/tools">
              <Button variant="link" className="mt-4">
                View all tools
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {tools.map((tool) => (
              <Link key={tool.id} href={tool.href}>
                <div className="group h-full bg-card border border-border hover:border-primary/50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  {/* Hero image — ~160px tall, centered, fills card width.
                      2026-04-29: was a 56px (h-14 w-14) icon; user feedback —
                      hero should be the visual anchor of the card. */}
                  <div className="relative w-full h-40 md:h-44 bg-primary/5 overflow-hidden flex items-center justify-center">
                    {tool.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tool.image}
                        alt={tool.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <Calculator className="h-16 w-16 text-primary/40" aria-hidden />
                    )}
                  </div>

                  <div className="relative z-10 p-6 md:p-7 flex flex-col flex-grow">
                    <h3 className="font-display text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">
                      {tool.excerpt}
                    </p>
                    <div className="mt-auto pt-4 flex items-center text-primary font-bold text-sm gap-2 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                      Try Tool <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
