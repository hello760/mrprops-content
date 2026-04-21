import type { CalculatorFormula } from "@/lib/calculator-recipes";

export interface CalculatorFieldCopy {
  key: string;
  label: string;
  helpText?: string;
}

export interface CalculatorResultCopy {
  key: string;
  label: string;
  helpText?: string;
}

export interface CalculatorBenefitStripItem {
  icon: "accuracy" | "speed" | "confidence";
  title: string;
  description: string;
}

export interface CalculatorLayoutCopy {
  reportButtonLabel?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  trustBadgeText?: string;
  helpfulHeading?: string;
  helpfulText?: string;
  reportModalTitle?: string;
  benefitStripItems?: CalculatorBenefitStripItem[];
}

export interface CalculatorUiCopy {
  fields?: CalculatorFieldCopy[];
  results?: CalculatorResultCopy[];
  layout?: CalculatorLayoutCopy;
  /**
   * 2026-04-21 Phase B2: recipe-driven math. When present and valid, the
   * renderer runs the named recipe from calculator-recipes.ts. When missing
   * or invalid, the renderer shows an explicit "not configured" banner —
   * the old silent "About This Tool" fallback is gone. See
   * market-me-good/src/lib/calculator-recipes.ts for the recipe catalogue.
   */
  formula?: CalculatorFormula;
}

// Re-export so components that already import from calculatorCopy can keep
// that import without needing a separate import from @/lib/calculator-recipes.
export type { CalculatorFormula };

export function getFieldCopy(copy: CalculatorUiCopy | undefined, key: string, fallbackLabel: string, fallbackHelpText?: string) {
  const item = copy?.fields?.find((field) => field.key === key);
  return {
    label: item?.label || fallbackLabel,
    helpText: item?.helpText || fallbackHelpText,
  };
}

export function getResultCopy(copy: CalculatorUiCopy | undefined, key: string, fallbackLabel: string, fallbackHelpText?: string) {
  const item = copy?.results?.find((result) => result.key === key);
  return {
    label: item?.label || fallbackLabel,
    helpText: item?.helpText || fallbackHelpText,
  };
}
