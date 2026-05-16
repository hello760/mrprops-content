"use client";

import { useMemo, useState , Fragment } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsletterCTA } from "@/components/newsletter/NewsletterCTA";
import { Input } from "@/components/ui/input";
import type { GlossaryTerm } from "@/lib/glossary";

// Browse-by-letter bucketing: strip explanatory framings ("What is X",
// "How to X", "Definition of X", etc.) before reading the first letter.
// This determines which letter bucket the term lives in. The displayed
// term name in the card is unchanged.
function bucketLetter(term: string): string {
  const stripped = term
    .replace(/^(what\s+is|how\s+to|why|when\s+to|definition\s+of|understanding)\s+(a\s+|an\s+|the\s+)?/i, "")
    .trim();
  const first = stripped[0]?.toUpperCase() ?? "#";
  return /[A-Z]/.test(first) ? first : "#";
}

export function GlossaryIndexClient({ terms }: { terms: GlossaryTerm[] }) {
  const [search, setSearch] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const filteredTerms = useMemo(() => {
    return terms
      .filter((t) => t.term.toLowerCase().includes(search.toLowerCase()) || t.definition.toLowerCase().includes(search.toLowerCase()))
      .filter((t) => !selectedLetter || bucketLetter(t.term) === selectedLetter)
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [terms, search, selectedLetter]);

  const alphabet = "#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="bg-secondary/20 py-20 border-b border-border">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Glossary</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">Property Management Glossary</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">The definitive guide to short-term rental terminology. Master the language of hospitality.</p>
          <div className="relative max-w-xl mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input className="h-14 pl-12 text-lg rounded-full shadow-lg bg-background border-border/50 focus-visible:ring-primary" placeholder="Search for a term (e.g. RevPAR)..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-7xl py-12">
        <div className="grid lg:grid-cols-[250px_1fr] gap-12">
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div className="font-bold text-lg flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Browse by Letter</div>
              <div className="flex flex-wrap gap-2">
                {alphabet.map((letter) => {
                  const isActive = selectedLetter === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setSelectedLetter((prev) => (prev === letter ? null : letter))}
                      aria-pressed={isActive}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
              <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 mt-8">
                <h3 className="font-bold text-primary mb-2">Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-4">Can&apos;t find the term you&apos;re looking for?</p>
                <Button variant="outline" size="sm" className="w-full">Suggest a Term</Button>
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold font-display">{search ? `Search Results for "${search}"` : selectedLetter ? `Terms starting with "${selectedLetter}"` : "All Terms"}</h2>
              <span className="text-muted-foreground text-sm">{filteredTerms.length} definitions found</span>
            </div>
            {filteredTerms.length > 0 ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredTerms.map((item, _newsletterIndex) => <Fragment key={item.id}>{_newsletterIndex === 9 && (<div className="col-span-full"><NewsletterCTA source="glossary_cta" /></div>)}<Link href={`/glossary/${item.slug}`}><div className="group h-full bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer flex flex-col"><h3 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors">{item.term}</h3><p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-grow line-clamp-3">{item.definition}</p><div className="flex items-center text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">Read Definition <ArrowRight className="ml-1 h-4 w-4" /></div></div></Link></Fragment>)}</div> : <div className="text-center py-20 bg-secondary/20 rounded-xl border border-dashed border-border"><p className="text-lg text-muted-foreground">No terms found{search ? ` matching "${search}"` : ""}{selectedLetter ? ` starting with "${selectedLetter}"` : ""}</p><Button variant="link" onClick={() => { setSearch(""); setSelectedLetter(null); }}>Clear filters</Button></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
