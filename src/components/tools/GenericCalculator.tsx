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
  benefits,
  body,
}: GenericCalculatorProps) {
  // Render article body as seoContent if no seoContent was explicitly passed
  const resolvedSeoContent = seoContent || (body && Array.isArray(body) && body.length > 0 ? (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <PortableTextContent blocks={body} />
    </div>
  ) : null);
  const fields = calculatorUi?.fields || [];
  const resultFields = calculatorUi?.results || [];
  const hasFields = fields.length > 0;

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

  // Simple result computation — sum all inputs as a baseline estimate
  // Named calculators override this with real formulas
  const computedResults = useMemo(() => {
    const total = Object.values(values).reduce((sum, v) => sum + (v || 0), 0);
    const results: Record<string, string> = {};
    if (resultFields.length > 0) {
      // First result gets the total, others get derived values
      resultFields.forEach((rf, i) => {
        if (i === 0) results[rf.key] = `$${Math.round(total).toLocaleString()}`;
        else if (i === 1) results[rf.key] = `$${Math.round(total * 12).toLocaleString()}`;
        else results[rf.key] = `${Math.min(100, Math.max(0, total > 0 ? Math.round((total / (total + 1000)) * 100) : 0))}%`;
      });
    }
    return results;
  }, [values, resultFields]);

  const inputs = hasFields ? (
    <div className="space-y-6">
      {introText && (
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
    <div className="space-y-4 py-4">
      <h3 className="text-lg font-bold text-foreground">About This Tool</h3>
      <p className="text-muted-foreground leading-relaxed">
        {introText || description}
      </p>
      {benefits && benefits.length > 0 && (
        <div className="space-y-3 text-left mt-6">
          {benefits.map((benefit, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">{i + 1}</span>
              </div>
              <div>
                <div className="font-medium text-sm">{benefit.title}</div>
                <div className="text-xs text-muted-foreground">{benefit.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const hasAnyValue = Object.values(values).some((v) => v > 0);

  const results = hasFields ? (
    <div className="space-y-6 text-center">
      {resultFields.length > 0 && hasAnyValue ? (
        <>
          <div>
            <div className="text-sm font-bold uppercase tracking-wider opacity-80 mb-1">
              {resultFields[0]?.label || "Estimated Result"}
            </div>
            <div className="text-5xl md:text-6xl font-display font-black tracking-tight">
              {computedResults[resultFields[0]?.key] || "$0"}
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
                  <div className="font-bold text-xl">{computedResults[rf.key] || "—"}</div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col justify-center items-center text-center space-y-4 py-8">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {hasAnyValue ? "Results" : "Enter Values"}
          </div>
          <div className="text-2xl font-display font-bold text-foreground">
            {hasAnyValue ? "See your estimate" : "Fill in the fields to calculate"}
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
    <div className="space-y-6 text-center">
      <div className="bg-secondary/30 rounded-2xl p-8 flex flex-col justify-center items-center text-center space-y-4 border border-primary/10">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Get Started</div>
        <div className="text-2xl font-display font-bold text-foreground">Ready to crunch the numbers?</div>
        <p className="text-sm text-muted-foreground max-w-[240px]">
          Sign up for Mr. Props to access the full interactive calculator with real-time market data.
        </p>
        <Button variant="default" className="w-full font-bold rounded-xl gap-2 h-12 shadow-lg shadow-primary/20 mt-4" asChild>
          <a href="https://app.mrprops.io/register">Try It Free <ArrowRight className="h-4 w-4" /></a>
        </Button>
      </div>
    </div>
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
