import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CTAProps {
  title?: string;
  text?: string;
  primaryButton?: { label: string; href?: string };
  secondaryButton?: { label: string; href?: string };
}

// CC↔Live truth fix (2026-05-19, Phase 4c): drop hardcoded default-param
// fallbacks ("Ready to Build Your Real Estate Empire?", "Join 10,000+
// investors..."). Section now hides entirely when CC has no ctaTitle —
// matches SEOContentSkeleton's CTA gate. The "No credit card required.
// Cancel anytime." trust microcopy stays as universal CTA chrome (brand
// affordance — applies whenever a CTA renders at all).
export function CTA({ title, text, primaryButton, secondaryButton }: CTAProps) {
  if (!title) return null;
  const secondaryHref = secondaryButton?.href || "/company/contact";
  const secondaryIsInternal = secondaryHref.startsWith("/");
  const primaryHref = primaryButton?.href || "https://app.mrprops.io/register";

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 -skew-y-3 transform origin-top-left scale-110 shadow-[0_0_40px_rgba(124,58,237,0.3)] border-b border-primary/10" />
      <div className="container mx-auto px-4 relative z-10 text-center">
        <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 tracking-tight max-w-3xl mx-auto">{title}</h2>
        {text ? (
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">{text}</p>
        ) : null}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {primaryButton?.label ? (
            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 w-full sm:w-auto" asChild>
              <a href={primaryHref}>{primaryButton.label} <ArrowRight className="ml-2 h-5 w-5" /></a>
            </Button>
          ) : null}
          {secondaryButton?.label ? (
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-border bg-background hover:bg-muted w-full sm:w-auto" asChild>
              {secondaryIsInternal ? <Link href={secondaryHref}>{secondaryButton.label}</Link> : <a href={secondaryHref}>{secondaryButton.label}</a>}
            </Button>
          ) : null}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">No credit card required. Cancel anytime.</p>
      </div>
    </section>
  );
}
