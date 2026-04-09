import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FAQProps {
  title?: string;
  description?: string;
  items?: Array<{ question: string; answer: string }>;
}

const defaultFaqs = [
  {
    question: "How does the Unified Inbox work?",
    answer: "It connects directly to Airbnb, Booking.com, VRBO, and WhatsApp. You get a single stream of messages and can reply to guests on any platform without switching apps."
  },
  {
    question: "Can the AI Concierge handle complex guest requests?",
    answer: "Yes. It uses context from your listing details and previous conversations to answer questions about check-in, wifi, parking, and house rules automatically, 24/7."
  },
  {
    question: "Are the property calculators free to use?",
    answer: "Our core calculators (Rental Yield, Renovation ROI, Airbnb Profit) are 100% free. Pro members get advanced export features and portfolio-wide analysis."
  },
  {
    question: "How easy is it to migrate my listings to Mr. Props?",
    answer: "Extremely easy. We have a one-click import for Airbnb and VRBO. Your calendar, pricing, and guest history sync automatically in under 2 minutes. Plus, if you need help, our team will jump in and assist you in 10 minutes or less."
  }
];

export function FAQ({
  title = "Frequently Asked Questions",
  description = "Everything you need to know about scaling your portfolio with Mr. Props.",
  items = defaultFaqs,
}: FAQProps) {
  return (
    <section className="py-24 bg-secondary/20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{title}</h2>
          <p className="text-muted-foreground text-lg">{description}</p>
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
