import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, MapPin, Star, User } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";

interface SEOContentSkeletonProps {
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  wordCount?: number;
  bannerImage?: string;
  mainTitle: string;
  introText: string;
  whatItIsTitle?: string;
  whatItIsContent?: React.ReactNode;
  benefitsTitle?: string;
  benefits?: { title: string; description: string }[];
  howItWorksTitle?: string;
  howItWorksSteps?: { title: string; description: string }[];
  reviewsTitle?: string;
  reviews?: { name: string; text: string; rating: number }[];
  servicesTitle?: string;
  services?: { title: string; href: string }[];
  pricingTitle?: string;
  pricingContent?: React.ReactNode;
  whyChooseUsTitle?: string;
  teamMembers?: { name: string; role: string; image?: string }[];
  locations?: string[];
  faqTitle?: string;
  faqs?: { question: string; answer: string }[];
  ctaTitle?: string;
  ctaText?: string;
  ctaButtonText?: string;
  ctaButtonHref?: string;
}

export function SEOContentSkeleton({
  slug,
  wordCount,
  bannerImage,
  mainTitle,
  introText,
  whatItIsTitle = "What is it?",
  whatItIsContent,
  benefitsTitle = "Key Benefits",
  benefits = [],
  howItWorksTitle = "How It Works",
  howItWorksSteps = [],
  reviewsTitle = "Client Reviews",
  reviews = [],
  servicesTitle = "Our Services",
  services = [],
  pricingTitle = "Pricing",
  pricingContent,
  whyChooseUsTitle = "Why Choose Us",
  teamMembers = [],
  locations = [],
  faqTitle = "Frequently Asked Questions",
  faqs = [],
  ctaTitle,
  ctaText,
  ctaButtonText = "Get Started",
  ctaButtonHref = "https://app.mrprops.io/register"
}: SEOContentSkeletonProps) {
  return (
    <div className="bg-background pb-20">
      <div className="hidden">
        <span data-testid="slug">{slug}</span>
        <span data-testid="word-count">{wordCount} words</span>
      </div>

      {bannerImage && (
        <div className="relative h-[40vh] w-full overflow-hidden">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bannerImage})` }}
          />
          <div className="relative z-20 container mx-auto h-full flex flex-col justify-end pb-12 px-4">
             <h1 className="font-display text-4xl md:text-6xl font-bold text-white drop-shadow-lg max-w-4xl">
               {mainTitle}
             </h1>
          </div>
        </div>
      )}

      {!bannerImage && mainTitle && (
        <div className="bg-secondary/20 py-20">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground max-w-4xl">
               {mainTitle}
            </h1>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12 max-w-screen-xl space-y-20">
        {introText && (
        <div className="prose prose-lg dark:prose-invert max-w-3xl">
          <p className="text-xl text-muted-foreground leading-relaxed">{introText}</p>
        </div>
        )}

        {whatItIsContent && (
          <section className="space-y-6">
            <h2 className="font-display text-3xl font-bold">{whatItIsTitle}</h2>
            <div className="prose prose-lg dark:prose-invert max-w-4xl">
              {whatItIsContent}
            </div>
          </section>
        )}

        {benefits.length > 0 && (
          <section className="space-y-8">
            <h2 className="font-display text-3xl font-bold">{benefitsTitle}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {benefits.map((benefit, i) => (
                <div key={i} className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {howItWorksSteps.length > 0 && (
          <section className="space-y-8">
            <h2 className="font-display text-3xl font-bold">{howItWorksTitle}</h2>
            <div className="relative border-l-2 border-primary/20 ml-4 space-y-12 py-4">
              {howItWorksSteps.map((step, i) => (
                <div key={i} className="relative pl-8">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                  <h3 className="font-bold text-xl mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {reviews.length > 0 && (
          <section className="bg-secondary/10 -mx-4 px-4 py-16 rounded-3xl">
            <div className="max-w-4xl mx-auto">
               <h2 className="font-display text-3xl font-bold text-center mb-12">{reviewsTitle}</h2>
               <div className="grid md:grid-cols-2 gap-8">
                 {reviews.map((review, i) => (
                   <div key={i} className="bg-background p-8 rounded-2xl shadow-sm border border-border">
                     <div className="flex gap-1 mb-4 text-accent">
                       {[...Array(5)].map((_, j) => (
                         <Star key={j} className={`h-4 w-4 ${j < review.rating ? 'fill-current' : 'text-muted/20'}`} />
                       ))}
                     </div>
                     <p className="italic text-muted-foreground mb-6">"{review.text}"</p>
                     <div className="font-bold text-sm">{review.name}</div>
                   </div>
                 ))}
               </div>
            </div>
          </section>
        )}

        {pricingContent && (
          <section className="space-y-8">
             <h2 className="font-display text-3xl font-bold">{pricingTitle}</h2>
             <div className="prose prose-lg dark:prose-invert max-w-4xl">
               {pricingContent}
             </div>
          </section>
        )}

        {services.length > 0 && (
          <section className="space-y-8">
             <h2 className="font-display text-3xl font-bold">{servicesTitle}</h2>
             <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
               {services.map((service, i) => (
                 <Link key={i} href={service.href}>
                   <div className="group border border-border p-4 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex items-center justify-between">
                     <span className="font-medium">{service.title}</span>
                     <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transform group-hover:translate-x-1 transition-transform" />
                   </div>
                 </Link>
               ))}
             </div>
          </section>
        )}

        {(teamMembers.length > 0 || locations.length > 0) && (
          <section className="space-y-12 border-t border-border pt-12">
            <h2 className="font-display text-3xl font-bold">{whyChooseUsTitle}</h2>

            {teamMembers.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-muted-foreground">Our Team</h3>
                <div className="grid sm:grid-cols-3 gap-8">
                  {teamMembers.map((member, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-secondary overflow-hidden">
                        {member.image ? (
                          <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary/10">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {locations.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-muted-foreground">Locations</h3>
                 <div className="flex flex-wrap gap-3">
                   {locations.map((loc, i) => (
                     <Badge key={i} variant="secondary" className="px-3 py-1 text-sm">
                       <MapPin className="h-3 w-3 mr-1" /> {loc}
                     </Badge>
                   ))}
                 </div>
              </div>
            )}

            <div className="bg-primary text-primary-foreground p-8 rounded-3xl text-center max-w-2xl mx-auto">
              <h3 className="font-display text-2xl font-bold mb-4">{ctaTitle}</h3>
              <p className="text-primary-foreground/80 mb-6">{ctaText}</p>
              <Button size="lg" variant="secondary" className="rounded-full font-bold" asChild>
                <a href={ctaButtonHref}>{ctaButtonText}</a>
              </Button>
            </div>
          </section>
        )}

        {faqs.length > 0 && (
          <section className="space-y-8 max-w-3xl mx-auto pt-12">
            <div className="text-center mb-12">
               <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{faqTitle}</h2>
               {mainTitle && <p className="text-muted-foreground text-lg">Common questions about {mainTitle}.</p>}
            </div>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border border-border bg-card rounded-xl px-6 shadow-sm">
                  <AccordionTrigger className="text-left font-display font-semibold text-lg hover:text-primary hover:no-underline py-6">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}
      </div>

      {ctaTitle && (
      <section className="py-24 bg-background relative overflow-hidden border-t border-border">
        <div className="absolute inset-0 bg-primary/5 -skew-y-3 transform origin-top-left scale-110" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 tracking-tight max-w-3xl mx-auto">
            {ctaTitle}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {ctaText}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 w-full sm:w-auto" asChild>
              <a href={ctaButtonHref}>{ctaButtonText} <ArrowRight className="ml-2 h-5 w-5" /></a>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-border bg-background hover:bg-muted w-full sm:w-auto">
              Talk to Sales
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section>
      )}

    </div>
  );
}
