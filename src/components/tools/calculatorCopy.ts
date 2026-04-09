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
}

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
