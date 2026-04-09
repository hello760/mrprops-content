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
  ctaButtonHref = "https://app.mrprops.io/register",
}: SEOContentSkeletonProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="hidden">
        <span data-testid="slug">{slug}</span>
        <span data-testid="word-count">{wordCount} words</span>
      </div>

      {bannerImage && (
        <div className="relative h-[40vh] w-full overflow-hidden">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bannerImage})` }} />
          <div className="relative z-20 container mx-auto h-full flex flex-col justify-end pb-12 px-4">
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white drop-shadow-lg max-w-4xl">{mainTitle}</h1>
          </div>
        </div>
      )}

      {!bannerImage && (
        <div className="bg-secondary/20 py-20">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground max-w-4xl">{mainTitle}</h1>
            <p className="text-xl text-muted-foreground mt-6 max-w-3xl">{introText}</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-5xl py-16 space-y-20">
        <section>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-8">{whatItIsTitle}</h2>
          <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed">{whatItIsContent || <p>{introText}</p>}</div>
        </section>

        {benefits.length > 0 && (
          <section>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-10">{benefitsTitle}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-xl">{benefit.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {howItWorksSteps.length > 0 && (
          <section>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-10">{howItWorksTitle}</h2>
            <div className="space-y-6">
              {howItWorksSteps.map((step, index) => (
                <div key={step.title} className="flex gap-6 items-start">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center flex-shrink-0 text-lg">{index + 1}</div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {reviews.length > 0 && (
          <section>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-10">{reviewsTitle}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div key={review.name} className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <div className="flex gap-1 mb-4">{Array.from({ length: review.rating }).map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />)}</div>
                  <p className="text-muted-foreground mb-6 italic">“{review.text}”</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
                    <div className="font-medium">{review.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {services.length > 0 && (
          <section>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-10">{servicesTitle}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {services.map((service) => (
                <Link key={service.title} href={service.href} className="group flex items-center justify-between p-5 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <span className="font-medium text-lg">{service.title}</span>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {pricingContent && (
          <section>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-10">{pricingTitle}</h2>
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">{pricingContent}</div>
          </section>
        )}

        {(teamMembers.length > 0 || locations.length > 0) && (
          <section>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-10">{whyChooseUsTitle}</h2>
            {teamMembers.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {teamMembers.map((member) => (
                  <div key={member.name} className="text-center p-6 bg-card border border-border rounded-xl">
                    <div className="h-20 w-20 rounded-full bg-primary/10 mx-auto mb-4 overflow-hidden">{member.image ? <img src={member.image} alt={member.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="h-8 w-8 text-primary" /></div>}</div>
                    <div className="font-bold text-lg">{member.name}</div>
                    <div className="text-muted-foreground">{member.role}</div>
                  </div>
                ))}
              </div>
            )}
            {locations.length > 0 && (
              <div>
                <h3 className="font-bold text-xl mb-4">Areas We Serve</h3>
                <div className="flex flex-wrap gap-3">{locations.map((location) => <Badge key={location} variant="secondary" className="px-4 py-2 text-sm"><MapPin className="h-3 w-3 mr-1" />{location}</Badge>)}</div>
              </div>
            )}
          </section>
        )}

        {faqs.length > 0 && (
          <section>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-10">{faqTitle}</h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.question} value={`item-${index}`} className="border border-border rounded-xl px-6 bg-card shadow-sm">
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-5">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}
      </div>

      {(ctaTitle || ctaText) && (
        <section className="bg-primary text-primary-foreground py-20 mt-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">{ctaTitle}</h2>
            <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">{ctaText}</p>
            <Button size="lg" variant="secondary" className="rounded-full px-8 h-14 text-lg font-bold shadow-lg" asChild>
              <a href={ctaButtonHref}>{ctaButtonText} <ArrowRight className="ml-2 h-5 w-5" /></a>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
