import Link from "next/link";
import { Benefits } from "@/components/sections/Benefits";
import { CTA } from "@/components/sections/CTA";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Testimonials } from "@/components/sections/Testimonials";
import { WhyUs } from "@/components/sections/WhyUs";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary/5 border-b border-border"><div className="container mx-auto px-4 py-24 text-center max-w-5xl"><div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary mb-6">Modern software for modern hosts</div><h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6">Build a better short-term rental operation.</h1><p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">Mr. Props combines property-management workflows, calculators, templates, comparisons, taxes, regulations, and glossary content into one SEO-ready hub.</p><div className="flex flex-col sm:flex-row gap-4 justify-center"><Button size="lg" className="rounded-full px-8" asChild><a href="https://app.mrprops.io/register">Get Started</a></Button><Button size="lg" variant="outline" className="rounded-full px-8" asChild><Link href="/guides">Explore Guides</Link></Button></div></div></section>
      <HowItWorks />
      <WhyUs />
      <Benefits />
      <Testimonials />
      <CTA />
    </div>
  );
}
