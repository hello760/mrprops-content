"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewsletterCTA } from "@/components/newsletter/NewsletterCTA";
import { cn } from "@/lib/utils";
import type { DirectoryEntry } from "@/lib/content-pages";
import { logarithmicPageLinks, pageHref } from "@/lib/pagination";

const GUIDE_CATEGORIES = ["All", "Finance", "Marketing", "Legal", "Operations"];
const ITEMS_PER_PAGE = 9;

type GuidePost = DirectoryEntry & {
  date?: string;
  readTime?: string;
  category?: string;
};

export function GuideIndexClient({
  guides,
  currentPage = 1,
}: {
  guides: GuidePost[];
  currentPage?: number;
}) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const featuredGuide = guides[0];

  const filteredPosts = useMemo(() => {
    return guides.filter((post) => {
      const category = post.category || "Operations";
      const categoryMatch = selectedCategory === "All" || category === selectedCategory;
      const haystack = `${post.title} ${post.excerpt} ${category}`.toLowerCase();
      const searchMatch =
        !searchTerm.trim() || haystack.includes(searchTerm.trim().toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [guides, searchTerm, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / ITEMS_PER_PAGE));
  // Clamp current page to valid range when filter shrinks the list.
  const safePage = Math.min(currentPage, totalPages);
  const currentPosts = filteredPosts.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );
  const pageNumbers = logarithmicPageLinks(safePage, totalPages);

  // When client-side filters change, the URL goes back to /guides (page 1).
  // Categories + search are filter-only, no URL change for the filter state itself.
  function resetToPage1IfNeeded() {
    if (safePage !== 1) router.push("/guides");
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="bg-secondary/30 border-b border-border/50">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-in slide-in-from-left-5 duration-700">
              {/* Featured Strategy label — refreshed 2026-04-30 to match MMG label
                  guidelines: rounded-full, soft shadow, subtle border, icon prefix. */}
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 text-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Featured Strategy
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-foreground">
                {featuredGuide?.title}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                {featuredGuide?.excerpt}
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href={`/guides/${featuredGuide?.slug}`}>
                  <Button
                    size="lg"
                    className="rounded-full font-bold h-12 px-8 shadow-lg shadow-primary/20"
                  >
                    Read Full Guide
                  </Button>
                </Link>
                <div className="flex items-center text-sm font-medium text-muted-foreground ml-2">
                  <span className="h-1 w-1 rounded-full bg-primary mx-3" />{" "}
                  {featuredGuide?.readTime}
                </div>
              </div>
            </div>
            <div className="relative group cursor-pointer animate-in zoom-in-95 duration-700 delay-100">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-[3rem] -rotate-3 group-hover:rotate-0 transition-transform duration-500" />
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl">
                {featuredGuide?.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featuredGuide.image}
                    alt={featuredGuide.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-20 z-30 bg-background/95 backdrop-blur border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {GUIDE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  resetToPage1IfNeeded();
                }}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                  selectedCategory === cat
                    ? "bg-foreground text-background"
                    : "hover:bg-secondary text-muted-foreground",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="w-full md:w-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                resetToPage1IfNeeded();
              }}
              className="pl-9 h-10 rounded-full w-full md:w-64 bg-secondary/50 border-transparent focus:bg-background transition-all"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <NewsletterCTA source="guides_cta" />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {currentPosts.map((post) => {
            const category = post.category || "Operations";
            return (
              <Link key={post.id} href={`/guides/${post.slug}`}>
                <div className="group cursor-pointer flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
                  <div className="aspect-[16/10] overflow-hidden bg-muted relative">
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-background/90 backdrop-blur text-foreground px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide shadow-sm flex items-center gap-1.5">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            category === "Finance"
                              ? "bg-green-500"
                              : category === "Marketing"
                                ? "bg-purple-500"
                                : category === "Legal"
                                  ? "bg-red-500"
                                  : "bg-blue-500",
                          )}
                        />
                        {category}
                      </span>
                    </div>
                    {post.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium mb-3">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> {post.readTime}
                      </span>
                      <span>•</span>
                      <span>{post.date}</span>
                    </div>
                    <h3 className="font-display text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6 line-clamp-3 flex-1 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="text-sm font-bold text-primary uppercase tracking-wider flex items-center mt-auto">
                      Read Article <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredPosts.length === 0 && (
          <div className="rounded-3xl border border-border bg-card px-8 py-16 text-center mb-16">
            <h3 className="font-display text-2xl font-bold mb-3">
              No guides matched that search
            </h3>
            <p className="text-muted-foreground mb-6">
              Try a broader keyword or switch back to all categories.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
                resetToPage1IfNeeded();
              }}
            >
              Reset filters
            </Button>
          </div>
        )}

        {/* Logarithmic pagination — see .claude/skills/pagination/SKILL.md.
            Crawlable Link hrefs (?page=N), self-canonical per page, current
            page derived from server-side searchParams (passed as prop). */}
        {totalPages > 1 && filteredPosts.length > 0 && (
          <nav
            aria-label="Guides pagination"
            className="flex justify-center items-center gap-2 flex-wrap"
          >
            {safePage > 1 ? (
              <Link
                href={pageHref("/guides", safePage - 1)}
                aria-label="Previous page"
                rel="prev"
              >
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-10 w-10 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                size="icon"
                disabled
                className="rounded-full h-10 w-10 border-border opacity-40"
                aria-label="Previous page (disabled)"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            {pageNumbers.map((p, i) => {
              const prev = pageNumbers[i - 1];
              const showEllipsis = prev !== undefined && p - prev > 1;
              return (
                <span key={p} className="flex items-center gap-2">
                  {showEllipsis && (
                    <span className="px-1 text-muted-foreground select-none" aria-hidden>
                      …
                    </span>
                  )}
                  {p === safePage ? (
                    <Button
                      variant="default"
                      className="rounded-full h-10 w-10 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25"
                      aria-current="page"
                    >
                      {p}
                    </Button>
                  ) : (
                    <Link href={pageHref("/guides", p)} aria-label={`Page ${p}`}>
                      <Button
                        variant="outline"
                        className="rounded-full h-10 w-10 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                      >
                        {p}
                      </Button>
                    </Link>
                  )}
                </span>
              );
            })}

            {safePage < totalPages ? (
              <Link
                href={pageHref("/guides", safePage + 1)}
                aria-label="Next page"
                rel="next"
              >
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-10 w-10 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                size="icon"
                disabled
                className="rounded-full h-10 w-10 border-border opacity-40"
                aria-label="Next page (disabled)"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
