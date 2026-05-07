"use client";

import { useMemo, useState , Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronRight as Chev,
  DollarSign,
  Globe,
  Home,
  Receipt,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsletterCTA } from "@/components/newsletter/NewsletterCTA";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DirectoryEntry } from "@/lib/content-pages";
import { logarithmicPageLinks, pageHref } from "@/lib/pagination";

const ITEMS_PER_PAGE = 9;
const REGION_ORDER = [
  "All",
  "United States",
  "Europe",
  "Asia",
  "Americas",
  "Oceania",
  "Africa & Middle East",
  "Other",
];

type Card = DirectoryEntry & { date?: string };

export function TaxesIndexClient({
  taxes,
  currentPage = 1,
  currentPlatform,
  allPlatforms,
}: {
  taxes: Card[];
  currentPage?: number;
  currentPlatform?: string;
  allPlatforms?: string[];
}) {
  const router = useRouter();
  const [region, setRegion] = useState("All");
  const [search, setSearch] = useState("");
  const featured = taxes[0];
  const basePath = currentPlatform ? `/taxes/${currentPlatform}` : "/taxes";

  const filtered = useMemo(() => {
    return taxes.filter((t) => {
      const regionMatch = region === "All" || t.region === region;
      const haystack = `${t.title} ${t.location} ${t.region} ${t.platform}`.toLowerCase();
      const searchMatch = !search.trim() || haystack.includes(search.trim().toLowerCase());
      return regionMatch && searchMatch;
    });
  }, [taxes, region, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const currentItems = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);
  const pageNumbers = logarithmicPageLinks(safePage, totalPages);

  function resetToPage1IfNeeded() {
    if (safePage !== 1) router.push(basePath);
  }

  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    taxes.forEach((t) => t.region && set.add(t.region));
    return REGION_ORDER.filter((r) => r === "All" || set.has(r));
  }, [taxes]);

  // Platform pill set — URL-changing. Same pattern as RegulationsIndexClient.
  const availablePlatforms = useMemo(() => {
    const fromList = allPlatforms || taxes.map((t) => t.platform).filter(Boolean) as string[];
    return Array.from(new Set(fromList)).sort();
  }, [allPlatforms, taxes]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="bg-secondary/30 border-b border-border/50">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-in slide-in-from-left-5 duration-700">
              <div className="flex items-center text-sm text-muted-foreground gap-2 overflow-x-auto whitespace-nowrap mb-2">
                <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
                  <Home className="h-3 w-3" /> Home
                </Link>
                <Chev className="h-4 w-4 flex-shrink-0" />
                <span className="text-foreground font-medium">Taxes</span>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 text-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Receipt className="h-3.5 w-3.5" aria-hidden /> Featured Tax Guide
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-foreground">
                {featured?.title || "Short-Term Rental Tax Guides"}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                {featured?.excerpt ||
                  "Comprehensive tax compliance guides for short-term rental hosts across the globe."}
              </p>
              {featured && (
                <div className="flex flex-wrap gap-4 pt-2">
                  <Link href={featured.href || `/taxes/${featured.platform}/${featured.slug.split("/").pop()}`}>
                    <Button size="lg" className="rounded-full font-bold h-12 px-8 shadow-lg shadow-primary/20">
                      View Tax Guide
                    </Button>
                  </Link>
                  <div className="flex items-center text-sm font-medium text-muted-foreground ml-2">
                    <span className="h-1 w-1 rounded-full bg-primary mx-3" /> {featured.region}
                  </div>
                </div>
              )}
            </div>
            <div className="relative group cursor-pointer animate-in zoom-in-95 duration-700 delay-100">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-[3rem] -rotate-3 group-hover:rotate-0 transition-transform duration-500" />
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl bg-primary/5 flex items-center justify-center">
                {featured?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.image}
                    alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <DollarSign className="h-24 w-24 text-primary/40" aria-hidden />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky filter bar — TWO pill rows:
          (1) Platform pills — URL-changing, SEO-crawlable.
          (2) Region pills — CSS-only filter, narrows visible card set.
          2026-04-30 (Helvis directive: two filter dimensions). */}
      <div className="sticky top-20 z-30 bg-background/95 backdrop-blur border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2 hidden md:inline">
              Rental type:
            </span>
            <Link href="/taxes">
              <button
                type="button"
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                  !currentPlatform ? "bg-primary text-white shadow-sm" : "hover:bg-secondary text-muted-foreground border border-border"
                )}
              >
                All
              </button>
            </Link>
            {availablePlatforms.map((p) => (
              <Link key={p} href={`/taxes/${p}`}>
                <button
                  type="button"
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap capitalize",
                    currentPlatform === p ? "bg-primary text-white shadow-sm" : "hover:bg-secondary text-muted-foreground border border-border"
                  )}
                >
                  {p}
                </button>
              </Link>
            ))}
          </div>
        </div>
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2 hidden md:inline">
              Region:
            </span>
            {availableRegions.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRegion(r);
                  resetToPage1IfNeeded();
                }}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                  region === r ? "bg-foreground text-background" : "hover:bg-secondary text-muted-foreground"
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="w-full md:w-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jurisdictions..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetToPage1IfNeeded();
              }}
              className="pl-9 h-10 rounded-full w-full md:w-64 bg-secondary/50 border-transparent focus:bg-background transition-all"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card px-8 py-16 text-center mb-16">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-display text-2xl font-bold mb-3">No tax guides matched</h3>
            <p className="text-muted-foreground mb-6">Try a broader region or clear the search.</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setRegion("All");
                resetToPage1IfNeeded();
              }}
            >
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
            {currentItems.map((item, _newsletterIndex) => (
              <Fragment key={item.id}>
                {_newsletterIndex === 6 && (
                  <div className="col-span-full">
                    <NewsletterCTA source="taxes_cta" />
                  </div>
                )}
                <Link href={item.href || `/taxes/${item.platform}/${item.slug.split("/").pop()}`}>
                <div className="group h-full bg-card border border-border hover:border-primary/50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative w-full h-40 md:h-44 bg-primary/5 overflow-hidden flex items-center justify-center">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.location || item.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <DollarSign className="h-16 w-16 text-primary/40" aria-hidden />
                    )}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-background/90 backdrop-blur text-foreground px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide shadow-sm">
                        {item.region || "Other"}
                      </span>
                    </div>
                  </div>
                  <div className="relative z-10 p-6 md:p-7 flex flex-col flex-grow">
                    <div className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">
                      {item.platform || "Airbnb"} · {item.date || "Updated"}
                    </div>
                    <h3 className="font-display text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {item.location || item.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">{item.excerpt}</p>
                    <div className="mt-auto pt-4 flex items-center text-primary font-bold text-sm gap-2 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                      View tax guide <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
              </Fragment>
            ))}
          </div>
        )}

        {totalPages > 1 && filtered.length > 0 && (
          <nav aria-label="Taxes pagination" className="flex justify-center items-center gap-2 flex-wrap">
            {safePage > 1 ? (
              <Link href={pageHref("/taxes", safePage - 1)} aria-label="Previous page" rel="prev">
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="icon" disabled className="rounded-full h-10 w-10 opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {pageNumbers.map((p, i) => {
              const prev = pageNumbers[i - 1];
              const showEllipsis = prev !== undefined && p - prev > 1;
              return (
                <span key={p} className="flex items-center gap-2">
                  {showEllipsis && <span className="px-1 text-muted-foreground" aria-hidden>…</span>}
                  {p === safePage ? (
                    <Button variant="default" className="rounded-full h-10 w-10 bg-primary text-white shadow-lg shadow-primary/25" aria-current="page">
                      {p}
                    </Button>
                  ) : (
                    <Link href={pageHref("/taxes", p)} aria-label={`Page ${p}`}>
                      <Button variant="outline" className="rounded-full h-10 w-10">
                        {p}
                      </Button>
                    </Link>
                  )}
                </span>
              );
            })}
            {safePage < totalPages ? (
              <Link href={pageHref("/taxes", safePage + 1)} aria-label="Next page" rel="next">
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="icon" disabled className="rounded-full h-10 w-10 opacity-40">
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
