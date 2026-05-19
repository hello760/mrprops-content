import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FAQProps {
  title?: string;
  description?: string;
  items?: Array<{ question: string; answer: string }>;
}

// CC↔Live truth fix (2026-05-19, Phase 4c): drop hardcoded defaultFaqs
// constant + default-param fallbacks. Section now hides when called with
// no items[] — matches PageBits.FAQAndCTA gate. Callers (home page) pass
// explicit brand FAQs; CC-driven render paths pass operator-managed faqs.
export function FAQ({ title, description, items }: FAQProps) {
  if (!items?.length) return null;
  return (
    <section className="py-24 bg-secondary/20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{title || "Frequently Asked Questions"}</h2>
          {description ? (
            <p className="text-muted-foreground text-lg">{description}</p>
          ) : null}
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {items.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border border-border bg-card rounded-xl px-6">
              <AccordionTrigger className="font-display font-semibold text-lg hover:text-primary hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
