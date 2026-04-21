"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalculatorLayout } from "./CalculatorLayout";
import type { CalculatorUiCopy } from "./calculatorCopy";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PortableTextContent } from "@/components/content/PortableTextContent";
import type { PortableTextBlock } from "@/lib/content-helpers";
import { AlertTriangle } from "lucide-react";
import { runFormula, validateFormula } from "@/lib/calculator-recipes";

interface GenericCalculatorProps {
  title?: string;
  description?: string;
  category?: string;
  toolName?: string;
  seoContent?: React.ReactNode;
  calculatorUi?: CalculatorUiCopy;
  introText?: string;
  benefits?: Array<{ title: string; description: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  body?: PortableTextBlock[];
}

/**
 * Generic calculator that renders interactive input fields and result outputs
 * from Sanity calculatorUi data. Works for any calculator type without
 * hardcoded formulas — users enter values and see labeled results.
 */
export function GenericCalculator({
  title = "Calculator",
  description = "Use this calculator to estimate costs and plan your budget.",
  category = "General",
  toolName,
  seoContent,
  calculatorUi,
  introText,
  // benefits intentionally unused in render paths after Phase B4 — the widget
  // either renders the input form or the "not configured" banner; there is
  // no longer a text-only fallback that used benefits. Keeping the prop so
  // ToolPageClient can still pass it without a TypeScript break.
  body,
}: GenericCalculatorProps) {
  // Render article body directly — calculator pages should NOT use blog-style SEO wrappers.
  // Body content contains tool-specific sections (benefits, how it works, CTA) as H2 headings.
  const resolvedSeoContent = seoContent || (body && Array.isArray(body) && body.length > 0 ? (
    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-a:text-primary">
      <PortableTextContent blocks={body} />
    </div>
  ) : null);
  const fields = calculatorUi?.fields || [];
  const resultFields = calculatorUi?.results || [];
  // `benefits` and `hasFields` are no longer used in render paths — post
  // Phase B4 the widget either renders (fields >= 2 + valid formula) or
  // shows the "not configured" banner. The old `hasFields`-branching
  // fallback is removed.

  // Dynamic state for all input fields
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const field of fields) {
      initial[field.key] = 0;
    }
    return initial;
  });

  const updateValue = (key: string, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  // Phase B4 (2026-04-21): recipe-driven math replaces the old dummy-sum
  // formula that was producing nonsense on every non-hardcoded calculator
  // slug (airbnb-expense-calculator showed "Net Revenue $1,310 / Net Profit
  // $15,720" for inputs 1000+100+100+10+100 — literal sum of all fields ×12).
  //
  // New behavior: resolve calculatorUi.formula against the recipe library.
  // If the formula validates, run it and render real output. If it doesn't,
  // `formulaValidation.valid === false` flips the results panel into an
  // explicit "not configured" banner — the old silent "About This Tool"
  // fallback is gone (see below: no more !hasFields branch for inputs panel).
  const availableFieldKeys = useMemo(() => fields.map((f) => f.key), [fields]);
  const availableResultKeys = useMemo(() => resultFields.map((r) => r.key), [resultFields]);
  const formulaValidation = useMemo(
    () =>
      validateFormula(
        calculatorUi?.formula ?? null,
        availableFieldKeys,
        availableResultKeys,
      ),
    [calculatorUi?.formula, availableFieldKeys, availableResultKeys],
  );
  const computedResults = useMemo(() => {
    if (!formulaValidation.valid || !calculatorUi?.formula) return null;
    return runFormula(
      calculatorUi.formula,
      values,
      availableFieldKeys,
      availableResultKeys,
    );
  }, [formulaValidation.valid, calculatorUi?.formula, values, availableFieldKeys, availableResultKeys]);

  // FIX-CALC-INTRO-DUP (2026-04-21): CalculatorLayout already renders `description`
  // as the hero subheadline (CalculatorLayout.tsx:86). For calculator pieces where
  // normalizeToolRow sets both description = sd.introText AND introText = sd.introText
  // (template-tools.ts:78,82), the same sentence rendered twice on the live page.
  // Only render introText inside the inputs panel when it differs from description.
  const showInputIntro = introText && introText.trim() !== (description || '').trim();

  // Phase B4 (2026-04-21): widget hard-requires a valid formula + fields + results.
  // When any of those are missing, BOTH panels show the same "not configured"
  // banner — no more silent "About This Tool" text fallback where the widget
  // should be. This closes the team's 2026-04-21 "calculator tool missing entirely"
  // failure mode.
  const widgetReady = fields.length >= 2 && resultFields.length >= 1 && formulaValidation.valid;

  const notConfiguredBanner = (
    <div className="space-y-4 py-8 text-center" role="alert" aria-live="polite">
      <AlertTriangle className="h-10 w-10 mx-auto text-amber-500" aria-hidden="true" />
      <h3 className="text-lg font-bold text-foreground">Calculator not configured</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        This tool is being set up. Contact the Mr. Props team to finish wiring the calculator — the supporting content is live but the interactive math isn&apos;t ready yet.
      </p>
      {process.env.NODE_ENV !== "production" && formulaValidation.errors.length > 0 && (
        <details className="text-xs text-muted-foreground max-w-md mx-auto text-left">
          <summary className="cursor-pointer opacity-70">Configuration errors (dev only)</summary>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            {formulaValidation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );

  const inputs = widgetReady ? (
    <div className="space-y-6">
      {showInputIntro && (
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">{introText}</p>
      )}
      <div className="grid gap-6">
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label className="text-base font-bold">{field.label}</Label>
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
            <Input
              type="number"
              value={values[field.key] || ""}
              onChange={(e) => updateValue(field.key, Number(e.target.value))}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className="h-12 text-lg"
            />
          </div>
        ))}
      </div>
    </div>
  ) : (
    notConfiguredBanner
  );

  const hasAnyValue = Object.values(values).some((v) => v > 0);

  const results = widgetReady ? (
    <div className="space-y-6 text-center">
      {hasAnyValue && computedResults ? (
        <>
          <div>
            <div className="text-sm font-bold uppercase tracking-wider opacity-80 mb-1">
              {resultFields[0]?.label || "Estimated Result"}
            </div>
            <div className="text-5xl md:text-6xl font-display font-black tracking-tight">
              {computedResults[resultFields[0]?.key]?.value || "—"}
            </div>
            {resultFields[0]?.helpText && (
              <p className="text-xs opacity-70 mt-2">{resultFields[0].helpText}</p>
            )}
          </div>
          {resultFields.length > 1 && (
            <div className={`grid gap-4 pt-2 ${resultFields.length > 2 ? "md:grid-cols-3" : "grid-cols-2"}`}>
              {resultFields.slice(1).map((rf) => (
                <div key={rf.key} className="bg-white/10 rounded-lg p-3">
                  <div className="text-xs opacity-70 mb-1">{rf.label}</div>
                  <div className="font-bold text-xl">{computedResults[rf.key]?.value || "—"}</div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col justify-center items-center text-center space-y-4 py-8">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Enter Values
          </div>
          <div className="text-2xl font-display font-bold text-foreground">
            Fill in the fields to calculate
          </div>
          <p className="text-sm text-muted-foreground max-w-[240px]">
            Enter your numbers on the left to get instant estimates.
          </p>
        </div>
      )}
      <div className="pt-4">
        <Button
          variant="default"
          className="w-full font-bold rounded-xl gap-2 h-12 shadow-lg shadow-primary/20"
          asChild
        >
          <a href="https://app.mrprops.io/register">
            Get Detailed Report <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  ) : (
    notConfiguredBanner
  );

  return (
    <CalculatorLayout
      title={title}
      description={description}
      category={category}
      toolName={toolName || title}
      inputs={inputs}
      results={results}
      seoContent={resolvedSeoContent}
      calculatorUi={calculatorUi}
    />
  );
}
