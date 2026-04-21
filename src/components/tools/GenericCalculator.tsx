"use client";

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { CalculatorLayout } from "./CalculatorLayout";
import type { CalculatorUiCopy } from "./calculatorCopy";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { PortableTextContent } from "@/components/content/PortableTextContent";
import type { PortableTextBlock } from "@/lib/content-helpers";
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

  // Heuristic unit inference from field key — used to pick slider vs input
  // and to choose sensible defaults. Key-based because LLM-generated fields
  // carry only {key,label,helpText}; `unit` lives on the recipe schema but
  // isn't replicated on the piece's field list today.
  const inferUnit = (key: string): 'percent' | 'nights' | 'count' | 'dollar' => {
    const k = key.toLowerCase();
    if (k.endsWith('pct') || k.includes('percent') || k.includes('rate') || k.includes('occupancy')) return 'percent';
    if (k.includes('night')) return 'nights';
    if (k.includes('count') || k.includes('turnover') || k.includes('booked') || k.includes('guests') || k.includes('number')) return 'count';
    return 'dollar';
  };

  const defaultFor = (key: string): number => {
    const u = inferUnit(key);
    if (u === 'percent') return 10;
    if (u === 'nights') return 20;
    if (u === 'count') return 5;
    // Dollar defaults: sensible STR numbers
    const k = key.toLowerCase();
    if (k.includes('revenue')) return 5000;
    if (k.includes('investment') || k.includes('property') || k.includes('value')) return 300000;
    if (k.includes('rent')) return 2000;
    if (k.includes('noi') || k.includes('profit')) return 3000;
    if (k.includes('fixed')) return 1800;
    if (k.includes('opex') || k.includes('operating') || k.includes('expense') || k.includes('cost')) return 800;
    return 1000;
  };

  // Initialize with sensible defaults so the widget shows real numbers
  // on first render (not $0 / empty state). Update helper bumps a value
  // and triggers recomputation via useMemo.
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const field of fields) {
      initial[field.key] = defaultFor(field.key);
    }
    return initial;
  });

  // When fields change (e.g. user saves new structured_data in Editor and
  // the page reloads with different keys), seed missing keys with defaults
  // so we don't leave the widget in a stale state.
  useEffect(() => {
    setValues((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const f of fields) {
        if (!(f.key in next)) {
          next[f.key] = defaultFor(f.key);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.length, fields.map((f) => f.key).join(',')]);

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

  // Polished input renderer — sliders for % fields, proper $/# prefixes,
  // matches the hand-coded AirbnbProfitCalculator style so GenericCalculator
  // pieces don't look visually downgraded next to hand-coded ones.
  const renderField = (field: typeof fields[number]) => {
    const unit = inferUnit(field.key);
    const val = values[field.key] ?? defaultFor(field.key);
    if (unit === 'percent') {
      return (
        <div key={field.key} className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-base font-bold">{field.label}</Label>
            <span className="text-2xl font-display font-bold text-primary">{val}%</span>
          </div>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
          <Slider
            value={[val]}
            onValueChange={(v) => updateValue(field.key, v[0])}
            min={0}
            max={100}
            step={0.5}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span><span>100%</span>
          </div>
        </div>
      );
    }
    const prefix = unit === 'dollar' ? '$' : '';
    const suffix = unit === 'nights' ? ' nights' : unit === 'count' ? '' : '';
    return (
      <div key={field.key} className="space-y-2">
        <Label className="text-base font-bold">{field.label}</Label>
        {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-medium pointer-events-none">{prefix}</span>
          )}
          <Input
            type="number"
            value={val}
            onChange={(e) => updateValue(field.key, Number(e.target.value) || 0)}
            className={`h-12 text-lg ${prefix ? 'pl-8' : ''}`}
            min={0}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">{suffix}</span>
          )}
        </div>
      </div>
    );
  };

  const inputs = widgetReady ? (
    <div className="space-y-6">
      {showInputIntro && (
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">{introText}</p>
      )}
      {fields.map(renderField)}
    </div>
  ) : (
    notConfiguredBanner
  );

  // Results panel — always computes live, never an empty "Enter values"
  // placeholder. The widget ships with sensible defaults so visitors see a
  // real example output on page load.
  const firstResult = resultFields[0];
  const firstComputed = computedResults && firstResult ? computedResults[firstResult.key] : null;

  const results = widgetReady ? (
    <div className="space-y-6 text-center">
      <div>
        <div className="text-sm font-bold uppercase tracking-wider opacity-80 mb-1">
          {firstResult?.label || "Estimated Result"}
        </div>
        <div className="text-5xl md:text-6xl font-display font-black tracking-tight">
          {firstComputed?.value ?? "—"}
        </div>
        {firstResult?.helpText && (
          <p className="text-xs opacity-70 mt-2">{firstResult.helpText}</p>
        )}
      </div>
      {resultFields.length > 1 && (
        <div className={`grid gap-4 pt-2 ${resultFields.length > 2 ? "md:grid-cols-3" : "grid-cols-2"}`}>
          {resultFields.slice(1).map((rf) => (
            <div key={rf.key} className="bg-white/10 rounded-lg p-3">
              <div className="text-xs opacity-70 mb-1">{rf.label}</div>
              <div className="font-bold text-xl">{(computedResults && computedResults[rf.key]?.value) || "—"}</div>
            </div>
          ))}
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
