import { ArrowRight, Calendar, Check, Globe, Mail, MessageSquare, Phone, PlayCircle, ShieldCheck, Star, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FAQ } from "@/components/sections/FAQ";
import { CTA } from "@/components/sections/CTA";
import { PortableTextContent } from "@/components/content/PortableTextContent";
import type { LandingContent } from "@/lib/content-pages";

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

export function LandingPageView({ page, pageType, slug }: { page: LandingContent; pageType: "features" | "services"; slug: string }) {
  const title = page.title || page.headline;
  const headline = page.headline || `Automate Your ${title}`;
  const description = page.subheadline || `Automate your ${title} with Mr. Props. The #1 toolkit for scaling your rental business.`;
  const trustLogos = page.trustBarLogos?.length ? page.trustBarLogos.map((item) => item.label) : defaultTrustLogos;
  const spotlightApps = page.spotlightApps?.length
    ? page.spotlightApps.map((item, index) => ({ ...spotlightDefaults[index % spotlightDefaults.length], label: item.label || spotlightDefaults[index % spotlightDefaults.length].label }))
    : spotlightDefaults;
  const features = page.features?.length
    ? page.features.map((item, index) => ({ ...featureDefaults[index % featureDefaults.length], title: item.title, description: item.description }))
    : featureDefaults;

  return (
    <div className="flex flex-col gap-0 bg-background text-foreground">
      <section className="relative overflow-hidden bg-background pb-16 pt-24 md:pb-24 md:pt-32">
        <div className="absolute left-0 top-0 -z-10 h-full w-full overflow-hidden">
          <div className="absolute right-[-5%] top-[-10%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-purple-500/5 blur-[120px]" />
        </div>
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="space-y-8 text-center lg:text-left">
              <Badge variant="outline" className="mx-auto w-fit rounded-full border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-primary lg:mx-0">
                {page.heroBadge || (pageType === "services" ? "Service" : "Feature")}
              </Badge>
              <h1 className="font-display text-5xl font-extrabold leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-7xl">{headline}</h1>
              <p className="mx-auto max-w-xl text-xl leading-relaxed text-muted-foreground lg:mx-0">{description}</p>
              <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row lg:justify-start">
                <Button size="lg" className="h-14 rounded-full bg-primary px-8 text-lg font-bold text-white shadow-xl shadow-primary/25 transition-all hover:scale-105 hover:bg-primary/90" asChild>
                  <a href={page.primaryCtaButton?.href || "https://app.mrprops.io/register"}>{page.primaryCtaButton?.label || "Start Free Trial"} <ArrowRight className="ml-2 h-5 w-5" /></a>
                </Button>
                <Button size="lg" variant="outline" className="h-14 rounded-full border-border bg-card px-8 text-lg font-medium text-foreground hover:bg-muted" asChild>
                  <a href={page.secondaryCtaButton?.href || "#demo"}><PlayCircle className="mr-2 h-5 w-5" /> {page.secondaryCtaButton?.label || "Watch Demo"}</a>
                </Button>
              </div>
              <div className="flex flex-col items-center justify-center gap-4 pt-2 text-sm text-muted-foreground sm:flex-row lg:justify-start">
                <span className="flex items-center gap-1"><Check className="h-4 w-4 text-green-500" /> No credit card required</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1"><Check className="h-4 w-4 text-green-500" /> Join 1,000+ Hosts</span>
              </div>
            </div>

            <div className="relative w-full">
              <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl ring-1 ring-border/50">
                <div className="flex items-center gap-2 border-b border-border bg-muted/50 p-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                    <div className="h-3 w-3 rounded-full bg-green-400/80" />
                  </div>
                  <div className="mx-auto w-1/2 truncate rounded bg-background/50 px-3 py-1 text-center font-mono text-[10px] text-muted-foreground">app.mrprops.io/{pageType}/{slug}</div>
                </div>
                <img src={page.image} alt={`${title} Dashboard Interface`} className="h-auto w-full object-cover" />
                <div className="absolute -bottom-6 -left-6 hidden items-center gap-4 rounded-xl border border-border bg-background p-4 shadow-xl md:flex">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600"><TrendingUp className="h-6 w-6" /></div>
                  <div>
                    <div className="font-bold text-foreground">Efficiency</div>
                    <div className="text-xs text-muted-foreground">+24% this week</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/50 bg-secondary/20 py-8">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <p className="mb-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">{page.trustBarLabel || "Trusted by hosts in 50+ cities"}</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale md:gap-12">
            {trustLogos.map((logo, index) => (
              <div key={`${logo}-${index}`} className="flex items-center gap-2 text-xl font-bold">
                {index === 0 ? <Globe className="h-6 w-6" /> : index === 1 ? <Calendar className="h-6 w-6" /> : index === 2 ? <Zap className="h-6 w-6" /> : index === 3 ? <Star className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="bg-background py-24 md:py-32">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="group isolate relative overflow-hidden rounded-[2.5rem] p-10 text-center shadow-2xl md:rounded-[3.5rem] md:p-24">
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
            <div className="relative z-10">
              <h2 className="mb-8 font-display text-4xl font-black tracking-tight text-white drop-shadow-sm md:text-6xl md:leading-tight">
                {page.spotlightTitle || <>Stop logging into <span className="bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent decoration-clone">5 apps.</span></>}
              </h2>
              <p className="mx-auto mb-14 max-w-3xl text-xl font-medium leading-relaxed text-indigo-50 opacity-90 md:text-2xl">{page.spotlightDescription || description}</p>
              <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                {spotlightApps.map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <div className="rounded-2xl border-4 border-white/10 bg-white p-4 shadow-xl md:p-6"><item.icon className={`h-8 w-8 md:h-10 md:w-10 ${item.color}`} /></div>
                    <span className="text-sm font-bold tracking-wide text-white opacity-80">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-6 font-display text-3xl font-bold md:text-5xl">{page.featuresTitle || "Why Mr. Props?"}</h2>
            <p className="text-xl text-muted-foreground">{page.featuresDescription || "Everything you need to master your property operations in one place."}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, i) => (
              <div key={i} className="group rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-xl">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110"><feature.icon className="h-7 w-7" /></div>
                <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {page.body?.length ? (
        <section className="border-y border-border/50 bg-secondary/30 py-20">
          <div className="container mx-auto max-w-4xl px-4 prose prose-lg dark:prose-invert">
            <PortableTextContent blocks={page.body} />
          </div>
        </section>
      ) : null}

      <FAQ title={page.faqTitle} description={page.faqDescription} items={page.faqs} />
      <CTA title={page.ctaTitle} text={page.ctaText} primaryButton={page.ctaPrimaryButton} secondaryButton={page.ctaSecondaryButton} />
    </div>
  );
}
