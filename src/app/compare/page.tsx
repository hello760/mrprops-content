import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, CheckCircle2, BarChart3, Scale, Home, ChevronRight } from "lucide-react";
import { fetchComparisons } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";

export const revalidate = 3600;
export const metadata = buildMetadata("Compare", "Software comparisons for short-term rental operators.", "/compare");

export default async function CompareIndexPage() {
  const comparisons = await fetchComparisons();

  return (
    <div className="min-h-screen bg-background pb-20 pt-20">
      <section className="container mx-auto px-4 max-w-4xl text-center mb-16">
        <div className="flex items-center justify-center text-sm text-muted-foreground gap-2 overflow-x-auto whitespace-nowrap mb-6">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <Link href="/guides" className="hover:text-primary transition-colors">Resources</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-foreground font-medium">Comparisons</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full font-bold text-sm mb-6"><Scale className="h-4 w-4" /> Unbiased Reviews</div>
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 tracking-tight">Software Comparisons for <br />Property Managers</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">The property management landscape is crowded. We&apos;ve tested the top tools side-by-side to help you choose the right stack for your business.</p>
        <div className="relative max-w-xl mx-auto mb-20"><div className="relative group"><div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div><div className="relative flex items-center bg-card border border-border rounded-xl p-2 shadow-xl"><Search className="h-5 w-5 text-muted-foreground ml-3 mr-2" /><Input placeholder="Compare Hostaway vs Guesty..." className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-lg h-12" /><Button className="rounded-lg font-bold">Search</Button></div></div><div className="mt-3 text-sm text-muted-foreground"><span className="font-bold">Trending:</span> Hostaway vs Guesty, Lodgify vs OwnerRez</div></div>
      </section>

      <section className="container mx-auto px-4 max-w-screen-xl mb-24">
        <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Popular Face-offs</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comparisons.map((comp, i) => {
            const [nameA = "A", nameB = "B"] = comp.title.split(" vs ");
            return (
              <Link key={comp.id} href={`/compare/${comp.slug}`}>
                <div className="group bg-card hover:bg-secondary/20 border border-border hover:border-primary/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                  {i < 3 && <div className="mb-4"><span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Most Read</span></div>}
                  <div className="flex items-center justify-between mb-6"><div className="text-center flex-1"><div className="font-display font-bold text-lg mb-1">{nameA}</div><div className="text-xs text-muted-foreground">Challenger</div></div><div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-black text-xs mx-2">VS</div><div className="text-center flex-1"><div className="font-display font-bold text-lg mb-1">{nameB}</div><div className="text-xs text-muted-foreground">Incumbent</div></div></div>
                  <div className="flex items-center justify-between pt-6 border-t border-border/50"><span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Read Comparison</span><ArrowRight className="h-4 w-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" /></div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl"><div className="bg-secondary/20 rounded-3xl p-8 md:p-12 border border-border"><h3 className="font-display text-2xl font-bold mb-6">Our Methodology</h3><div className="space-y-6 text-muted-foreground leading-relaxed"><p>At Mr. Props, we believe in transparency. Our comparisons are based on rigorous testing, real user reviews, and objective feature analysis.</p><div className="grid sm:grid-cols-2 gap-6 mt-8"><div className="flex items-start gap-3"><CheckCircle2 className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" /><div><h4 className="font-bold text-foreground mb-1">Feature Verification</h4><p className="text-sm">We sign up for trials to verify every feature claim manually.</p></div></div><div className="flex items-start gap-3"><CheckCircle2 className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" /><div><h4 className="font-bold text-foreground mb-1">Pricing Analysis</h4><p className="text-sm">We break down hidden fees, commission structures, and add-ons.</p></div></div></div></div></div></section>
    </div>
  );
}
