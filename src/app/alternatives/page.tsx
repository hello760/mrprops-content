import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, RefreshCw, Database, Home, ChevronRight } from "lucide-react";
import { fetchAlternatives } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";

export const revalidate = 3600;
export const metadata = buildMetadata("Alternatives", "Competitor alternatives for hosts and property managers.", "/alternatives");

export default async function AlternativesIndexPage() {
  const competitors = await fetchAlternatives();

  return (
    <div className="min-h-screen bg-background pb-20 pt-20">
      <section className="container mx-auto px-4 max-w-4xl text-center mb-20">
        <div className="flex items-center justify-center text-sm text-muted-foreground gap-2 overflow-x-auto whitespace-nowrap mb-6">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <Link href="/guides" className="hover:text-primary transition-colors">Resources</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-foreground font-medium">Alternatives</span>
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 tracking-tight">Find the Best Alternative to <br className="hidden md:block" />Your Current PMS</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">Don&apos;t settle for outdated software, hidden fees, or poor support. See how Mr. Props stacks up against the competition.</p>
      </section>

      <section className="container mx-auto px-4 max-w-screen-xl mb-24">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {competitors.map((comp) => (
            <Link key={comp.id} href={`/alternatives/${comp.slug}`}>
              <div className="group bg-card hover:bg-primary/5 border border-border hover:border-primary/50 rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col items-center justify-center min-h-[200px]">
                <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center text-xl font-bold text-muted-foreground mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-inner">{comp.title.charAt(0)}</div>
                <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">{comp.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{comp.excerpt}</p>
                <div className="text-xs font-bold uppercase tracking-wider text-primary opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-1">Compare <ArrowRight className="h-3 w-3" /></div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-secondary/30 border-y border-border py-20">
        <div className="container mx-auto px-4 max-w-screen-xl text-center">
          <h2 className="font-display text-3xl font-bold mb-12">Why switch to Mr. Props?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-8 rounded-3xl border border-border/50 shadow-sm"><div className="h-12 w-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><ShieldCheck className="h-6 w-6" /></div><h3 className="font-bold text-xl mb-3">Safe Migration</h3><p className="text-muted-foreground">We import all your listings, reviews, and future bookings. Zero data loss.</p></div>
            <div className="bg-background p-8 rounded-3xl border border-border/50 shadow-sm"><div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><RefreshCw className="h-6 w-6" /></div><h3 className="font-bold text-xl mb-3">Modern Sync</h3><p className="text-muted-foreground">Our API connections are 10x faster than iCal links used by older software.</p></div>
            <div className="bg-background p-8 rounded-3xl border border-border/50 shadow-sm"><div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Database className="h-6 w-6" /></div><h3 className="font-bold text-xl mb-3">Better Data</h3><p className="text-muted-foreground">Get actionable insights on revenue, occupancy, and maintenance costs.</p></div>
          </div>
          <div className="mt-12"><Button size="lg" className="rounded-full px-8 h-14 text-lg font-bold shadow-xl shadow-primary/20">Start Your Free Migration</Button></div>
        </div>
      </section>
    </div>
  );
}
