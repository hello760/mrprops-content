"use client";

// 2026-04-22: the slug-switch that routed 6 specific slugs to dedicated
// hardcoded calculator components has been removed. Every calculator page
// now renders through GenericCalculator, which reads the admin-configured
// `calculatorUi` from structured_data and runs real math via the recipe
// library. This fixes the drift where a published piece's admin config
// (correct recipe + correct fields for the topic) was overridden by a
// slug-matched hardcoded component that had the WRONG topic — e.g.
// `tools/operations/cleaning-fee-calculator` has title "Vacation Rental
// Cap Rate Calculator" + admin recipe `cap_rate` + fields
// [annualNoi, propertyValue], but the legacy slug match routed it through
// CleaningFeeEstimator which shows cleaning-fee inputs. Admin config is
// now the single source of truth for every calculator.
import { GenericCalculator } from "@/components/tools/GenericCalculator";
import { Button } from "@/components/ui/button";
import { ArrowRight, Settings2, BarChart3, Target } from "lucide-react";
import type { ToolPageContent } from "@/lib/template-tools";

type FAQItem = { question: string; answer: string };

interface ToolPageClientProps {
  page: ToolPageContent;
}

function categoryLabel(category: string) {
  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/* ---------- Tool-specific sections per PDF spec ---------- */

/** "How [Calculator] Works" — 3-step input breakdown (spec requirement T-6) */
function HowItWorksSection({ toolName }: { toolName: string }) {
  const steps = [
    { icon: Settings2, title: "Enter Your Numbers", description: "Input your property-specific data — rental income, expenses, and market variables." },
    { icon: BarChart3, title: "Review the Analysis", description: "The calculator applies industry-standard formulas to compute your results in real time." },
    { icon: Target, title: "Make Better Decisions", description: "Use the data to evaluate opportunities, compare scenarios, and optimize your portfolio." },
  ];

  return (
    <div className="space-y-8">
      <h2 className="font-display text-3xl font-extrabold tracking-tight text-center">
        How <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">{toolName}</span> Works
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <div key={step.title} className="relative flex flex-col items-center text-center p-6 bg-secondary/20 rounded-2xl">
            <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
              {i + 1}
            </div>
            <div className="h-14 w-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
              <step.icon className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-lg mb-3">{step.title}</h3>
            <p className="text-muted-foreground text-sm">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mid-page CTA (spec requirement T-8: between How It Works and FAQ) */
function ToolCTA() {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12 text-center space-y-4">
      <h2 className="font-display text-2xl md:text-3xl font-bold">Ready to take the guesswork out of property management?</h2>
      <p className="text-muted-foreground max-w-2xl mx-auto">Mr. Props gives you all these calculators plus real-time portfolio tracking, automated reporting, and data-driven insights.</p>
      <Button className="font-bold rounded-xl gap-2 h-12 shadow-lg shadow-primary/20 mt-4" asChild>
        <a href="https://app.mrprops.io/register">Start Free Trial <ArrowRight className="h-4 w-4" /></a>
      </Button>
      <p className="text-xs text-muted-foreground">No credit card required</p>
    </div>
  );
}

/** Tool-specific FAQ section (spec requirement T-7: 4-6 questions, no blog-article skeleton) */
function ToolFAQSection({ faqs, toolName }: { faqs?: FAQItem[]; toolName: string }) {
  const items = faqs?.length ? faqs : [
    { question: `How accurate is the ${toolName}?`, answer: "Our calculations use industry-standard formulas and are calibrated against real market data from 50+ cities. Results are estimates — always verify with local data before making investment decisions." },
    { question: `Is the ${toolName} free to use?`, answer: "Yes, completely free with no account required. For detailed PDF reports and portfolio tracking, you can sign up for a free Mr. Props trial." },
    { question: `What data do I need to use this tool?`, answer: "You'll need basic property financials: expected rental income, monthly expenses, and property value or purchase price. The more accurate your inputs, the more useful the output." },
    { question: "Can I save or export my results?", answer: "Click 'Email me this detailed report' below the results panel to receive a comprehensive PDF breakdown of your analysis." },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl font-extrabold tracking-tight text-center">Frequently Asked Questions</h2>
      <div className="max-w-3xl mx-auto divide-y divide-border">
        {items.map((faq) => (
          <details key={faq.question} className="group py-4">
            <summary className="flex items-center justify-between cursor-pointer font-bold text-foreground hover:text-primary transition-colors">
              {faq.question}
              <span className="ml-4 text-muted-foreground group-open:rotate-45 transition-transform text-xl">+</span>
            </summary>
            <p className="mt-3 text-muted-foreground leading-relaxed">{faq.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

/* ---------- Main Component ---------- */

/**
 * Derive a SHORT display name from a calculator/tool page title.
 *
 * Production pieces use a long SEO-optimized title (e.g.
 * "Airbnb Profit Calculator: Optimize Your Rental Income Today") as both the
 * H1 and as the interpolated `{toolName}` inside "How is {toolName} helpful?"
 * and "How the {toolName} Works". That produces headings like
 * "How is Airbnb Profit Calculator: Optimize Your Rental Income Today helpful?"
 * which is unreadable and makes headings look spammy.
 *
 * Rules (in priority order):
 *  1. If title contains " | " → take the left side (handles "X | Mr Props")
 *  2. If title contains ": " → take the left side (handles "X: subhead")
 *  3. If title starts with a canonical calculator name ("Airbnb Profit
 *     Calculator", etc.), return that substring.
 *  4. Otherwise, truncate at the first " — " or " – " dash.
 *  5. Fallback to the full title.
 *
 * Kept in this file (not lib/) because the rule is display-only and specific
 * to tool-page headings; body/SEO title/meta still use the full `page.title`.
 */
function deriveDisplayName(title: string): string {
  if (!title) return title;
  const pipeIdx = title.indexOf(' | ');
  if (pipeIdx > 0) return title.slice(0, pipeIdx).trim();
  const colonIdx = title.indexOf(': ');
  if (colonIdx > 0) return title.slice(0, colonIdx).trim();
  const emDashIdx = title.indexOf(' — ');
  if (emDashIdx > 0) return title.slice(0, emDashIdx).trim();
  const enDashIdx = title.indexOf(' – ');
  if (enDashIdx > 0) return title.slice(0, enDashIdx).trim();
  return title;
}

export function ToolPageClient({ page }: ToolPageClientProps) {
  // 2026-04-21: use a derived display name for heading interpolation instead of
  // the full SEO title. The H1 itself still uses the full page.title below in
  // the individual calculator components; this variable only feeds into the
  // "How is ___ helpful?" / "How the ___ Works" / FAQ heading templates.
  const toolName = deriveDisplayName(page.title);

  // Per PDF spec: tool pages are NOT article pages.
  // Instead of SEOContentSkeleton (which renders blog sections like What Is It, Benefits,
  // Reviews, Services), we render tool-specific sections:
  //   1. Body content (if exists from Sanity — tool-specific PortableText)
  //   2. "How [Calculator] Works" — 3-step breakdown
  //   3. CTA
  //   4. FAQ (4-6 tool-specific questions)
  const seoContent = (
    <div className="space-y-20">
      {/* FIX-022 (PF-22): removed bodyHtml/body rendering on calculator pages. PDF tools-section
          spec: "A calculator page is not a blog article or guide. Do not write editorial sections
          that explain the topic the calculator addresses." Every supporting section exists below
          (how-it-works, CTA, FAQ) as a structured component. The bodyHtml was causing duplicate
          "How is Calculator Helpful?" sections + duplicate FAQ + Lucide icon name leakage
          ("DollarSign (Lucide)") rendering as prose. PF-23 closed by this removal too. */}

      {/* How It Works — from structured_data if available, else static fallback */}
      {page.howItWorks?.length ? (
        <div className="space-y-6">
          <h2 className="font-display text-2xl md:text-3xl font-bold">How the {toolName} Works</h2>
          <p className="text-muted-foreground">This calculator breaks down your estimate using key inputs. Each one refines the output.</p>
          <div className="grid gap-6">
            {page.howItWorks.map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-bold text-lg mb-2">{item.fieldName}</h3>
                <p className="text-muted-foreground text-sm mb-1">{item.measures}</p>
                <p className="text-sm">{item.whyItMatters}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <HowItWorksSection toolName={toolName} />
      )}

      {/* CTA — from structured_data if available, else static fallback.
          2026-04-21: the entire seoContent is rendered inside a `.prose` wrapper
          in CalculatorLayout.tsx:172. `.prose h2/p/a` selectors (from globals.css)
          have higher CSS specificity than Tailwind's `.text-white`, so the
          prior text-primary-foreground / text-white classes were silently
          overridden to the dark foreground color. Solution: inline style={{ color }}
          on each text element so specificity 1,0,0,0 always wins. globals.css
          doesn't ship a `not-prose` escape hatch so we can't opt out of prose
          at the wrapper level, and restructuring seoContent out of the prose
          wrapper would touch every calculator component. Inline style is
          the smallest, safest fix that survives the prose-h2 rule. */}
      {page.cta ? (
        <div className="bg-gradient-to-br from-primary to-purple-600 rounded-2xl p-12 text-center" style={{ color: '#fff' }}>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: '#fff' }}>{page.cta.headline}</h2>
          <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.9)' }}>{page.cta.sentence}</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a href={page.cta.primaryButton?.href || "/register"} className="bg-white font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors no-underline" style={{ color: 'hsl(var(--primary))' }}>{page.cta.primaryButton?.label || "Get Started Free"}</a>
            <a href={page.cta.secondaryButton?.href || "/contact"} className="border-2 font-bold px-8 py-3 rounded-lg transition-colors no-underline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.1)' }}>{page.cta.secondaryButton?.label || "Talk to Sales"}</a>
          </div>
          <p className="text-sm mt-4" style={{ color: 'rgba(255,255,255,0.8)' }}>{page.cta.trustMicrocopy || "No credit card required. Cancel anytime."}</p>
        </div>
      ) : (
        <ToolCTA />
      )}

      <ToolFAQSection faqs={page.faqs} toolName={toolName} />
    </div>
  );

  const sharedProps = {
    title: page.title,
    description: page.description,
    category: categoryLabel(page.category),
    // Use the derived short name for breadcrumb + template-interpolated headings
    // ("How is {toolName} helpful?", "How the {toolName} Works"). The H1 below
    // still renders the full `title` so SEO signal is preserved on the page.
    toolName,
    seoContent,
    calculatorUi: page.calculatorUi,
  };

  return (
    <GenericCalculator
      {...sharedProps}
      introText={page.introText}
      benefits={page.benefits}
      faqs={page.faqs}
      body={page.body}
    />
  );
}
