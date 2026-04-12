import type { Metadata } from "next";
import { ArrowRight, Calendar, Check, CheckCircle2, Globe, Mail, MessageSquare, Phone, PlayCircle, Quote, ShieldCheck, Star, TrendingUp, XCircle, Zap } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FAQ } from "@/components/sections/FAQ";
import { CTA } from "@/components/sections/CTA";
import { PortableTextContent } from "@/components/content/PortableTextContent";
import { JsonLd } from "@/components/content/PageBits";
import { fetchLandingPageBySlug, fetchLandingPages } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";
import { buildStructuredData, createBreadcrumbSchema, createFaqSchema, createSoftwareApplicationSchema } from "@/lib/structured-data";

export const revalidate = 3600;

const defaultTrustLogos = ["Airbnb", "Booking.com", "Vrbo", "Expedia", "TripAdvisor"];
const spotlightDefaults = [
  { icon: Phone, color: "text-green-500", label: "WhatsApp" },
  { icon: Mail, color: "text-blue-500", label: "Email" },
  { icon: Globe, color: "text-pink-500", label: "Airbnb" },
  { icon: Calendar, color: "text-indigo-500", label: "Booking.com" },
];
const featureDefaults = [
  { icon: MessageSquare, title: "Unified Inbox", description: "Respond to guests from Airbnb, VRBO, and Booking.com in a single thread." },
  { icon: Calendar, title: "Smart Sync", description: "Prevent double bookings with our real-time calendar synchronization engine." },
  { icon: Zap, title: "Auto-Pilot", description: "Set up triggers to automatically schedule cleaners and send check-in instructions." },
  { icon: Globe, title: "Multi-Channel", description: "Distribute your listing to millions of potential guests with one click." },
  { icon: ShieldCheck, title: "Risk Scoring", description: "Automatically screen guests before you accept a booking request." },
  { icon: TrendingUp, title: "Revenue Mgmt", description: "Dynamic pricing algorithms that adjust to local demand signals." },
];

export async function generateStaticParams() {
  const pages = await fetchLandingPages("services");
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchLandingPageBySlug("services", slug);
  return buildMetadata(page?.seoTitle || "Services", page?.seoDescription || "Mr. Props services.", `/services/${slug}`);
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchLandingPageBySlug("services", slug);
  if (!page) notFound();

  const path = `/services/${page.slug}`;
  const structuredData = buildStructuredData(
    createBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
      { name: page.title },
    ]),
    createSoftwareApplicationSchema(path),
    createFaqSchema(page.faqs),
  );

  const title = page.title || page.headline;
  const headline = page.headline || `Automate Your ${title}`;
  const description = page.subheadline || `Automate your ${title} with Mr. Props. The #1 toolkit for scaling your rental business.`;
  const trustLogos = page.trustBarLogos?.length ? page.trustBarLogos.map((item) => item.label) : defaultTrustLogos;
  const spotlightApps = page.spotlightApps?.length ? page.spotlightApps.map((item, index) => ({ ...spotlightDefaults[index % spotlightDefaults.length], label: item.label || spotlightDefaults[index % spotlightDefaults.length].label })) : spotlightDefaults;
  const features = page.features?.length ? page.features.map((item, index) => ({ ...featureDefaults[index % featureDefaults.length], title: item.title, description: item.description })) : featureDefaults;

  return (
    <>
      <div className="flex flex-col gap-0 bg-background text-foreground">
        <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-background">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10"><div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" /><div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" /></div>
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="space-y-8 text-center lg:text-left animate-in slide-in-from-left-5 duration-700">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mx-auto lg:mx-0 w-fit">{page.heroBadge || "Service"}</Badge>
                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-foreground">{headline}</h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">{description}</p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                  <Button size="lg" className="h-14 px-8 text-lg font-bold shadow-xl shadow-primary/25 bg-primary hover:bg-primary/90 text-white rounded-full transition-all hover:scale-105" asChild>
                    <a href={page.primaryCtaButton?.href || "https://app.mrprops.io/register"}>{page.primaryCtaButton?.label || "Start Free Trial"} <ArrowRight className="ml-2 h-5 w-5" /></a>
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium border-border bg-card hover:bg-muted text-foreground rounded-full" asChild>
                    <a href={page.secondaryCtaButton?.href || "#demo"}><PlayCircle className="mr-2 h-5 w-5" /> {page.secondaryCtaButton?.label || "Watch Demo"}</a>
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground pt-2"><span className="flex items-center gap-1"><Check className="h-4 w-4 text-green-500" /> No credit card required</span><span className="hidden sm:inline">•</span><span className="flex items-center gap-1"><Check className="h-4 w-4 text-green-500" /> Join 1,000+ Hosts</span></div>
              </div>
              <div className="relative animate-in zoom-in-95 duration-1000 delay-200 w-full">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card group ring-1 ring-border/50">
                  <div className="bg-muted/50 border-b border-border p-3 flex items-center gap-2"><div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400/80" /><div className="w-3 h-3 rounded-full bg-yellow-400/80" /><div className="w-3 h-3 rounded-full bg-green-400/80" /></div><div className="mx-auto bg-background/50 px-3 py-1 rounded text-[10px] font-mono text-muted-foreground w-1/2 text-center truncate">app.mrprops.io/services/{slug}</div></div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={page.image} alt={`${title} Dashboard Interface`} className="w-full h-auto object-cover" />
                  <div className="absolute -bottom-6 -left-6 bg-background border border-border p-4 rounded-xl shadow-xl flex items-center gap-4 animate-bounce hidden md:flex"><div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><TrendingUp className="h-6 w-6" /></div><div><div className="font-bold text-foreground">Efficiency</div><div className="text-xs text-muted-foreground">+24% this week</div></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/50 bg-secondary/20 py-8"><div className="container mx-auto px-4 max-w-7xl text-center"><p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">{page.trustBarLabel || "Trusted by hosts in 50+ cities"}</p><div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-50 grayscale">{trustLogos.map((logo, index) => <div key={`${logo}-${index}`} className="flex items-center gap-2 font-bold text-xl">{index === 0 ? <Globe className="h-6 w-6" /> : index === 1 ? <Calendar className="h-6 w-6" /> : index === 2 ? <Zap className="h-6 w-6" /> : index === 3 ? <Star className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}{logo}</div>)}</div></div></section>

        <section id="demo" className="py-24 md:py-32 bg-background"><div className="container mx-auto px-4 max-w-6xl"><div className="relative rounded-[2.5rem] md:rounded-[3.5rem] p-10 md:p-24 text-center overflow-hidden shadow-2xl group isolate"><div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 z-0" /><div className="relative z-10"><h2 className="font-display text-4xl md:text-6xl md:leading-tight font-black mb-8 text-white drop-shadow-sm tracking-tight">{page.spotlightTitle || <>Stop logging into <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-200 decoration-clone">5 apps.</span></>}</h2><p className="text-xl md:text-2xl text-indigo-50 leading-relaxed max-w-3xl mx-auto mb-14 font-medium opacity-90">{page.spotlightDescription || description}</p><div className="flex flex-wrap justify-center gap-4 md:gap-8">{spotlightApps.map((item, i) => <div key={i} className="flex flex-col items-center gap-3 group/icon"><div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl border-4 border-white/10"><item.icon className={`h-8 w-8 md:h-10 md:w-10 ${item.color}`} /></div><span className="text-white font-bold text-sm tracking-wide opacity-80">{item.label}</span></div>)}</div></div></div></div></section>

        <section className="py-20 bg-background"><div className="container mx-auto px-4 max-w-7xl"><div className="text-center max-w-3xl mx-auto mb-16"><h2 className="font-display text-3xl md:text-5xl font-bold mb-6">{page.featuresTitle || "Why Mr. Props?"}</h2><p className="text-xl text-muted-foreground">{page.featuresDescription || "Everything you need to master your property operations in one place."}</p></div><div className="grid md:grid-cols-3 gap-8">{features.map((feature, i) => <div key={i} className="group p-8 rounded-2xl border border-border bg-card hover:shadow-xl hover:border-primary/30 transition-all duration-300"><div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform"><feature.icon className="h-7 w-7" /></div><h3 className="text-xl font-bold mb-3">{feature.title}</h3><p className="text-muted-foreground leading-relaxed">{feature.description}</p></div>)}</div></div></section>

        {page.statsBar?.length ? (
          <section className="py-16 bg-secondary/30 border-y border-border/50">
            <div className="container mx-auto px-4 max-w-5xl">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
                {page.statsBar.map((stat, i) => (
                  <div key={i} className="space-y-2">
                    <div className="text-4xl md:text-5xl font-extrabold text-primary font-display">{stat.value}</div>
                    <div className="text-sm md:text-base text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {page.howItWorksSteps?.length ? (
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4 max-w-5xl">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{page.howItWorksTitle || "How It Works"}</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {page.howItWorksSteps.map((step, i) => (
                  <div key={i} className="relative text-center p-8">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl font-bold mx-auto mb-6 ring-4 ring-primary/5">{i + 1}</div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {(page.comparisonPros?.length || page.comparisonCons?.length) ? (
          <section className="py-20 bg-secondary/20">
            <div className="container mx-auto px-4 max-w-5xl">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{page.comparisonTitle || "Why Switch to Mr. Props?"}</h2>
                {page.comparisonDescription ? <p className="text-xl text-muted-foreground">{page.comparisonDescription}</p> : null}
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-card border border-border rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><CheckCircle2 className="h-5 w-5" /></div>
                    <h3 className="text-xl font-bold text-foreground">Mr. Props</h3>
                  </div>
                  <ul className="space-y-3">
                    {(page.comparisonPros || []).map((pro, i) => (
                      <li key={i} className="flex items-start gap-3 text-foreground"><Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" /><span>{pro}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="bg-card border border-border rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><XCircle className="h-5 w-5" /></div>
                    <h3 className="text-xl font-bold text-foreground">Traditional Tools</h3>
                  </div>
                  <ul className="space-y-3">
                    {(page.comparisonCons || []).map((con, i) => (
                      <li key={i} className="flex items-start gap-3 text-muted-foreground"><XCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" /><span>{con}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {page.testimonials?.length ? (
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{page.testimonialsTitle || "What Hosts Say"}</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {page.testimonials.map((t, i) => (
                  <div key={i} className="bg-card border border-border rounded-2xl p-8 relative">
                    <Quote className="h-8 w-8 text-primary/20 absolute top-6 right-6" />
                    <div className="flex gap-1 mb-4">{[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>
                    <p className="text-foreground leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                    <div>
                      <div className="font-bold text-foreground">{t.name}</div>
                      {t.role ? <div className="text-sm text-muted-foreground">{t.role}</div> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {page.body?.length ? (
          <section className="py-20 bg-secondary/30 border-y border-border/50">
            <div className="container mx-auto px-4 max-w-4xl prose prose-lg">
              <PortableTextContent blocks={page.body} />
            </div>
          </section>
        ) : null}
        <FAQ title={page.faqTitle} description={page.faqDescription} items={page.faqs} />
        <CTA title={page.ctaTitle} text={page.ctaText} primaryButton={page.ctaPrimaryButton} secondaryButton={page.ctaSecondaryButton} />
      </div>
      <JsonLd data={structuredData} />
    </>
  );
}
