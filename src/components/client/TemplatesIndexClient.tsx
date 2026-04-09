"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, FileText, Filter, Home, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DirectoryEntry } from "@/lib/content-pages";

const CATEGORIES = ["All", "Marketing", "Legal", "Operations", "Guest Experience"];

function titleCaseCategory(slug: string) {
  return slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export function TemplatesIndexClient({ pages }: { pages: Array<DirectoryEntry & { category: string; href: string }> }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = useMemo(() => {
    return pages.filter((template) => {
      const categoryName = titleCaseCategory(template.category);
      const matchesCategory = selectedCategory === "All" || categoryName === selectedCategory;
      const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [pages, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background pb-20 pt-4 md:pt-8">
      <div className="container mx-auto px-4 max-w-screen-xl">
        <div className="flex items-center text-sm text-muted-foreground gap-2 mb-6 overflow-x-auto whitespace-nowrap"><Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link><ChevronRight className="h-4 w-4 flex-shrink-0" /><span className="text-foreground font-medium">Templates</span></div>
      </div>
      <div className="bg-primary/5 border-b border-border mb-12 rounded-3xl mx-4 overflow-hidden"><div className="container mx-auto px-4 py-12 md:py-16 text-center max-w-4xl"><Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">Free Resources</Badge><h1 className="font-display text-3xl md:text-6xl font-bold mb-6">Everything You Need to Run <br className="hidden md:block" />a Better Short-Term Rental</h1><p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">Download our battle-tested templates, checklists, and calculators. Used by over 10,000+ hosts to save time and increase revenue.</p><div className="max-w-md mx-auto relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input className="pl-10 h-12 rounded-full shadow-sm bg-background" placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div></div></div>
      <div className="container mx-auto px-4 max-w-screen-xl">
        <div className="flex flex-wrap items-center gap-2 mb-10 pb-4 border-b border-border overflow-x-auto whitespace-nowrap"><Filter className="h-4 w-4 text-muted-foreground mr-2" />{CATEGORIES.map((category) => <button key={category} onClick={() => setSelectedCategory(category)} className={cn("px-4 py-2 rounded-full text-sm font-bold transition-all border", selectedCategory === category ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-secondary border-border text-muted-foreground")}>{category}</button>)}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{filteredTemplates.map((template) => <Link key={template.id} href={template.href}><div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col"><div className="aspect-[4/3] bg-secondary relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-black/10" /><div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md">Free</div></div><div className="p-5 flex flex-col flex-grow"><div className="text-xs font-bold text-primary mb-2 uppercase tracking-wide">{titleCaseCategory(template.category)}</div><h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{template.title}</h3><p className="text-sm text-muted-foreground line-clamp-3 mb-4">{template.excerpt}</p><div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground"><div className="flex items-center gap-1"><FileText className="h-3 w-3" /> PDF, Word</div><div className="flex items-center gap-1"><Download className="h-3 w-3" /> Free</div></div></div></div></Link>)}</div>
        {filteredTemplates.length === 0 && <div className="text-center py-20 text-muted-foreground">No templates found matching your criteria.</div>}
      </div>
    </div>
  );
}
