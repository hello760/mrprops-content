"use client";

import { AirbnbProfitCalculator } from "@/components/tools/AirbnbProfitCalculator";
import { BedroomRenoCalculator } from "@/components/tools/BedroomRenoCalculator";
import { CleaningFeeEstimator } from "@/components/tools/CleaningFeeEstimator";
import { GenericCalculator } from "@/components/tools/GenericCalculator";
import { KitchenCostCalculator } from "@/components/tools/KitchenCostCalculator";
import { RenovationROICalculator } from "@/components/tools/RenovationROICalculator";
import { SEOContentSkeleton } from "@/components/content/SEOContentSkeleton";
import type { ToolPageContent } from "@/lib/template-tools";

interface ToolPageClientProps {
  page: ToolPageContent;
}

function categoryLabel(category: string) {
  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ToolPageClient({ page }: ToolPageClientProps) {
  const seoContent = (
    <SEOContentSkeleton
      seoTitle={page.seoTitle}
      seoDescription={page.seoDescription}
      slug={`/tools/${page.category}/${page.slug}`}
      mainTitle={page.mainTitle}
      introText={page.introText}
      benefits={page.benefits}
      faqs={page.faqs}
    />
  );

  const sharedProps = {
    title: page.title,
    description: page.description,
    category: categoryLabel(page.category),
    toolName: page.title,
    seoContent,
    calculatorUi: page.calculatorUi,
  };

  switch (page.slug) {
    case "airbnb-profit-calculator":
      return <AirbnbProfitCalculator {...sharedProps} />;
    case "cleaning-fee-calculator":
      return <CleaningFeeEstimator {...sharedProps} />;
    case "renovation-roi-calculator":
    case "roi-calculator":
      return <RenovationROICalculator {...sharedProps} />;
    case "kitchen-cost-calculator":
      return <KitchenCostCalculator {...sharedProps} />;
    case "bedroom-reno-calculator":
      return <BedroomRenoCalculator {...sharedProps} />;
    default:
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
}
