"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DirectoryEntry } from "@/lib/content-pages";

const GUIDE_CATEGORIES = ["All", "Finance", "Marketing", "Legal", "Operations"];

export function GuideIndexClient({ guides }: { guides: Array<DirectoryEntry & { date?: string; readTime?: string }> }) {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 9;
  const featuredGuide = guides[0];

  const filteredPosts = useMemo(() => {
    return guides.filter((post) => {
      const category = post.heroBadge || "Operations";
      const categoryMatch = selectedCategory === "All" || category === selectedCategory;
      const haystack = `${post.title} ${post.excerpt} ${category}`.toLowerCase();
      const searchMatch = !searchTerm.trim() || haystack.includes(searchTerm.trim().toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [guides, searchTerm, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / itemsPerPage));
  const currentPosts = filteredPosts.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="bg-secondary/30 border-b border-border/50">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 px-3 py-1 text-sm font-bold uppercase tracking-wider rounded-full inline-flex">Featured Strategy</div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-foreground">{featuredGuide?.title}</h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">{featuredGuide?.excerpt}</p>
              <div className="flex flex-wrap gap-4 pt-2 items-center">
                <Link href={`/guides/${featuredGuide?.slug}`}><Button size="lg" className="rounded-full font-bold h-12 px-8 shadow-lg shadow-primary/20">Read Full Guide</Button></Link>
                <div className="flex items-center text-sm font-medium text-muted-foreground ml-2"><span className="h-1 w-1 rounded-full bg-primary mx-3" /> {featuredGuide?.readTime}</div>
              </div>
            </div>
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-[3rem] -rotate-3 group-hover:rotate-0 transition-transform duration-500" />
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl">
                <img src={featuredGuide?.image} alt={featuredGuide?.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-20 z-30 bg-background/95 backdrop-blur border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {GUIDE_CATEGORIES.map((cat) => <button key={cat} onClick={() => { setSelectedCategory(cat); setPage(1); }} className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${selectedCategory === cat ? "bg-foreground text-background" : "hover:bg-secondary text-muted-foreground"}`}>{cat}</button>)}
          </div>
          <div className="w-full md:w-auto relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search topics..." value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} className="pl-9 h-10 rounded-full w-full md:w-64 bg-secondary/50 border-transparent focus:bg-background transition-all" /></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-12 mb-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10 space-y-4 max-w-xl text-center md:text-left"><h3 className="font-display text-2xl md:text-3xl font-bold">Join 15,000+ Smart Hosts</h3><p className="text-primary-foreground/80 text-lg">Get weekly tips on automation, tax loopholes, and market trends delivered to your inbox.</p></div>
          <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-3"><Input placeholder="Enter your email" className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 min-w-[280px] rounded-xl" /><Button variant="secondary" size="lg" className="h-12 font-bold px-8 rounded-xl shadow-lg">Subscribe</Button></div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {currentPosts.map((post) => <Link key={post.id} href={`/guides/${post.slug}`}><div className="group cursor-pointer flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"><div className="aspect-[16/10] overflow-hidden bg-muted relative"><div className="absolute top-4 left-4 z-10"><span className="bg-background/90 backdrop-blur text-foreground px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide shadow-sm flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />{post.heroBadge || "Operations"}</span></div><div className="w-full h-full bg-slate-800 group-hover:scale-105 transition-transform duration-700 bg-cover bg-center" style={{ backgroundImage: `url(${post.image})` }} /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" /></div><div className="p-6 flex flex-col flex-1"><div className="flex items-center gap-3 text-xs text-muted-foreground font-medium mb-3"><span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {post.readTime}</span><span>•</span><span>{post.date}</span></div><h3 className="font-display text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-tight">{post.title}</h3><p className="text-muted-foreground text-sm mb-6 line-clamp-3 flex-1 leading-relaxed">{post.excerpt}</p><div className="text-sm font-bold text-primary uppercase tracking-wider flex items-center mt-auto">Read Article <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" /></div></div></div></Link>)}
        </div>

        {filteredPosts.length === 0 && <div className="rounded-3xl border border-border bg-card px-8 py-16 text-center mb-16"><h3 className="font-display text-2xl font-bold mb-3">No guides matched that search</h3><p className="text-muted-foreground mb-6">Try a broader keyword or switch back to all categories.</p><Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedCategory("All"); setPage(1); }}>Reset filters</Button></div>}

        {totalPages > 1 && filteredPosts.length > 0 && <div className="flex justify-center items-center gap-2"><Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>{Array.from({ length: totalPages }).map((_, i) => <Button key={i} variant={page === i + 1 ? "default" : "outline"} className={`rounded-full h-10 w-10 ${page === i + 1 ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25" : "border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"}`} onClick={() => setPage(i + 1)}>{i + 1}</Button>)}<Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button></div>}
      </div>
    </div>
  );
}
