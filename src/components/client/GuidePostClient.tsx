"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Clock, Home, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PortableTextContent, portableTextHeadings } from "@/components/content/PortableTextContent";
import type { DirectoryEntry } from "@/lib/content-pages";

export function GuidePostClient({ guide, relatedGuides }: { guide: DirectoryEntry & { date?: string; readTime?: string }; relatedGuides: Array<DirectoryEntry & { date?: string; readTime?: string }> }) {
  const [activeSection, setActiveSection] = useState("");

  const sections = useMemo(() => portableTextHeadings(guide.body), [guide.body]);

  useEffect(() => {
    const headings = Array.from(document.querySelectorAll("article h2[id]"));
    if (headings.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveSection(entry.target.id);
      });
    }, { rootMargin: "-100px 0px -60% 0px" });
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [guide.slug, sections.length]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <article className="min-h-screen bg-background pb-20 pt-20">
      <div className="container mx-auto px-4 max-w-screen-xl mb-8">
        <div className="flex items-center text-sm text-muted-foreground gap-2 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <Link href="/guides" className="hover:text-primary transition-colors">Guides</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{guide.title}</span>
        </div>
      </div>

      <header className="container mx-auto px-4 max-w-4xl text-center mb-16">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 px-3 py-1 text-sm font-bold uppercase tracking-wider">{guide.heroBadge || "Guide"}</Badge>
          <span className="text-muted-foreground text-sm font-medium">Updated {guide.date}</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-foreground mb-8">{guide.title}</h1>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-3"><div className="h-10 w-10 border border-border rounded-full bg-primary text-white flex items-center justify-center font-bold">MP</div><div className="text-left"><div className="font-bold text-foreground text-sm leading-none">Mr. Props Team</div><div className="text-xs">Operational Experts</div></div></div>
          <div className="hidden sm:block w-px h-8 bg-border" />
          <div className="flex items-center gap-4 text-sm font-medium"><div className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {guide.date}</div><div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {guide.readTime}</div></div>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-5xl mb-16"><div className="aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl relative group"><img src={guide.image} alt={guide.title} className="w-full h-full object-cover" /></div></div>

      <div className="container mx-auto px-4 max-w-screen-xl grid lg:grid-cols-[250px_1fr_300px] gap-12 items-start">
        <div className="hidden lg:block sticky top-32">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Contents</h3>
          <nav className="space-y-1 border-l border-border pl-4">{sections.map((item) => <button key={item.id} onClick={() => scrollToSection(item.id)} className={cn("block text-sm py-1.5 transition-colors text-left w-full hover:text-primary", activeSection === item.id ? "text-primary font-bold -ml-[17px] pl-[13px] border-l-4 border-primary" : "text-muted-foreground")}>{item.label}</button>)}</nav>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-3xl mx-auto prose-headings:font-display prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-p:leading-relaxed prose-li:marker:text-primary">
          {sections.length > 0 && <div className="lg:hidden mb-12 bg-secondary/20 rounded-xl p-6 border border-border"><h3 className="font-bold text-lg mb-4">Table of Contents</h3><ul className="space-y-3 list-none pl-0 my-0">{sections.map((item, index) => <li key={item.id}><button onClick={() => scrollToSection(item.id)} className="text-primary font-medium hover:underline text-base pl-0 flex items-center gap-2"><span className="text-muted-foreground text-sm font-mono">{String(index + 1).padStart(2, "0")}.</span> {item.label}</button></li>)}</ul></div>}
          <p className="lead text-xl text-muted-foreground font-medium mb-8">{guide.excerpt}</p>
          <PortableTextContent blocks={guide.body} />
        </div>

        <div className="space-y-8 lg:sticky lg:top-32"><div><h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Related Guides</h3><ul className="space-y-4">{relatedGuides.map((item) => <li key={item.slug} className="group cursor-pointer"><Link href={`/guides/${item.slug}`}><div className="text-xs font-bold text-primary mb-1">{item.heroBadge || "Guide"}</div><div className="font-bold text-sm group-hover:text-primary transition-colors leading-snug">{item.title}</div></Link></li>)}</ul></div></div>
      </div>
    </article>
  );
}
