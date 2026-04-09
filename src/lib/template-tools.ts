import { sanityFetch } from "@/lib/sanity";
import type { PortableTextBlock } from "@/lib/content-helpers";
import type { CalculatorUiCopy } from "@/components/tools/calculatorCopy";

export interface ToolPageContent {
  id: string;
  category: string;
  slug: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  mainTitle: string;
  introText: string;
  benefits: Array<{ title: string; description: string }>;
  faqs: Array<{ question: string; answer: string }>;
  body?: PortableTextBlock[];
  calculatorUi?: CalculatorUiCopy;
}

interface SanityToolDoc {
  _id: string;
  category?: string;
  slug?: { current?: string };
  title?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  mainTitle?: string;
  introText?: string;
  benefits?: Array<{ title: string; description: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  body?: PortableTextBlock[];
  calculatorUi?: CalculatorUiCopy;
}

const createField = (key: string, label: string, helpText?: string) => ({ key, label, ...(helpText ? { helpText } : {}) });
const createResult = (key: string, label: string, helpText?: string) => ({ key, label, ...(helpText ? { helpText } : {}) });

export const toolFallbacks: ToolPageContent[] = [
  {
    id: "tool-airbnb-profit-calculator",
    category: "booking",
    slug: "airbnb-profit-calculator",
    title: "Airbnb Profitability Calculator",
    description: "Calculate your potential short-term rental profits with our advanced algorithm.",
    seoTitle: "Airbnb Profit Calculator 2026 | Mr. Props",
    seoDescription: "Free Airbnb profit calculator. Estimate revenue, expenses, and ROI for your short-term rental property.",
    mainTitle: "How to use this calculator",
    introText: "Knowing your numbers is the first step to running a successful Airbnb business. This calculator helps you estimate your potential monthly and annual profits by factoring in occupancy rates, nightly prices, and operational costs.",
    benefits: [
      { title: "Accurate Projections", description: "Based on real market data formulas used by top property managers." },
      { title: "Expense Tracking", description: "Don't forget hidden costs like cleaning and management fees." },
      { title: "Scenario Planning", description: "Test different ADR and occupancy scenarios to find your sweet spot." },
    ],
    faqs: [
      { question: "What is a good profit margin for Airbnb?", answer: "Most successful hosts aim for a 20-40% profit margin after all expenses, including rent or mortgage and utilities." },
      { question: "How do I estimate occupancy?", answer: "Market average is typically around 65%, but prime locations can reach 80%+. Use a conservative 60% for safe planning." },
    ],
    calculatorUi: {
      fields: [
        createField("adr", "Average Daily Rate (ADR)"),
        createField("occupancy", "Occupancy Rate"),
        createField("rent", "Monthly Rent / Mortgage ($)"),
        createField("cleaning", "Cleaning Fee per Stay ($)"),
        createField("management", "Management Fee (%)"),
      ],
      results: [
        createResult("monthlyProfit", "Estimated Monthly Profit"),
        createResult("annualProfit", "Annual Profit"),
        createResult("profitMargin", "Profit Margin"),
      ],
      layout: {
        reportButtonLabel: "Email me this detailed report",
        primaryCtaLabel: "Start Free Trial",
        primaryCtaHref: "https://app.mrprops.io/register",
        trustBadgeText: "Based on 2026 Market Data",
        reportModalTitle: "Get Your {title} Report",
        helpfulHeading: "How is {toolName} helpful?",
        helpfulText: "Most hosts guess their numbers. Pros use data. This tool helps you make unemotional, data-driven decisions about your property portfolio, ensuring every dollar you invest yields a measurable return.",
        benefitStripItems: [
          { icon: "accuracy", title: "Accuracy", description: "Based on real-time market data from 50+ cities." },
          { icon: "speed", title: "Speed", description: "Get answers in seconds, not hours of spreadsheet work." },
          { icon: "confidence", title: "Confidence", description: "Bank-grade formulas used by institutional investors." },
        ],
      },
    },
  },
  {
    id: "tool-cleaning-fee-calculator",
    category: "operations",
    slug: "cleaning-fee-calculator",
    title: "Cleaning Fee Calculator",
    description: "Set a profitable cleaning fee without hurting conversion.",
    seoTitle: "Cleaning Fee Calculator | Mr. Props",
    seoDescription: "Estimate the right guest-facing cleaning fee for your short-term rental.",
    mainTitle: "Price cleaning with confidence",
    introText: "A cleaning fee that is too low eats margin. Too high and it hurts conversion. Use this calculator to balance labor, linen, and reset time against what guests will actually accept.",
    benefits: [
      { title: "Protect Margin", description: "Cover labor, laundry, and restocking without guessing." },
      { title: "Stay Competitive", description: "Sanity-check your fee against booking friction." },
      { title: "Scale Operations", description: "Standardize pricing across your portfolio." },
    ],
    faqs: [
      { question: "Should cleaning be a pass-through fee?", answer: "In most cases yes, but many operators add a small buffer for supplies and coordination." },
      { question: "How often should I review my fee?", answer: "Review quarterly or whenever vendor rates, linen costs, or stay length patterns change." },
    ],
    calculatorUi: {
      fields: [
        createField("cleanerRate", "Cleaner hourly rate ($)"),
        createField("supplies", "Supplies & linen per turn ($)"),
        createField("hours", "Cleaning hours"),
        createField("buffer", "Operator buffer", "Use a small buffer to cover coordination, consumables, and surprise resets."),
      ],
      results: [
        createResult("recommendedFee", "Recommended Guest Cleaning Fee"),
        createResult("baseTurnCost", "Base Turn Cost"),
        createResult("bufferAdded", "Buffer Added"),
      ],
    },
  },
  {
    id: "tool-renovation-roi-calculator",
    category: "renovations",
    slug: "renovation-roi-calculator",
    title: "Renovation ROI Calculator",
    description: "Should you upgrade that kitchen? Find out if the investment pays off.",
    seoTitle: "Renovation ROI Calculator | Mr. Props",
    seoDescription: "Estimate payback period and first-year ROI for your next short-term rental renovation.",
    mainTitle: "Know when the upgrade pays back",
    introText: "Renovations should increase nightly rate, occupancy, or both. Use this calculator to estimate how fast a project earns its way back.",
    benefits: [
      { title: "Faster Decisions", description: "Quickly compare renovation options before spending capital." },
      { title: "Clear Break-even", description: "See how many months it takes to recover your budget." },
      { title: "Better Rate Strategy", description: "Tie renovation scope directly to achievable ADR lift." },
    ],
    faqs: [
      { question: "What occupancy does this assume?", answer: "The default model assumes a 65% occupancy rate as a conservative baseline for many markets." },
      { question: "Can I use this for cosmetic upgrades?", answer: "Yes. It works for anything from paint and furniture to full kitchen or bathroom remodels." },
    ],
    calculatorUi: {
      fields: [
        createField("cost", "Total Renovation Cost ($)", "Include materials and labor."),
        createField("rateIncrease", "Expected Nightly Rate Increase", "How much more can you charge per night?"),
      ],
      results: [
        createResult("monthsToBreakEven", "Months to Break Even"),
        createResult("roiFirstYear", "1-Year ROI"),
        createResult("annualRevenueIncrease", "Annual Revenue Increase"),
      ],
    },
  },
  {
    id: "tool-roi-calculator",
    category: "renovations",
    slug: "roi-calculator",
    title: "ROI Calculator",
    description: "Quickly estimate the payoff of your next renovation or revenue lift.",
    seoTitle: "ROI Calculator | Mr. Props",
    seoDescription: "Estimate renovation payback and first-year ROI for short-term rental upgrades.",
    mainTitle: "Estimate ROI before you spend",
    introText: "Use a simple revenue-lift model to see whether a renovation or upgrade is worth the cash outlay.",
    benefits: [
      { title: "Simple Model", description: "Fast first-pass ROI analysis without complex spreadsheets." },
      { title: "Break-even Clarity", description: "Know exactly how long payback may take." },
      { title: "Budget Discipline", description: "Prioritize projects with the highest potential return." },
    ],
    faqs: [
      { question: "Is this different from the renovation ROI calculator?", answer: "It uses the same interactive calculator and is kept as an alternate slug for content compatibility." },
    ],
  },
  {
    id: "tool-kitchen-cost-calculator",
    category: "renovations",
    slug: "kitchen-cost-calculator",
    title: "Kitchen Cost Calculator",
    description: "Full gut renovation estimates including cabinets, countertops, and appliances.",
    seoTitle: "Kitchen Cost Calculator | Mr. Props",
    seoDescription: "Estimate a kitchen renovation budget by size and finish tier.",
    mainTitle: "Budget the kitchen before demo day",
    introText: "Cabinetry, countertops, labor, and appliances add up quickly. Use this estimator to set a realistic renovation budget.",
    benefits: [
      { title: "Range Planning", description: "Model economy, mid-range, and luxury renovation scopes." },
      { title: "Faster Budgeting", description: "Get a fast directional estimate before collecting contractor quotes." },
      { title: "Capital Allocation", description: "Avoid over-investing relative to expected rental upside." },
    ],
    faqs: [
      { question: "Does this include labor?", answer: "Yes. The estimate is intended to represent all-in project cost, not just materials." },
      { question: "Can I use metric dimensions?", answer: "Convert to square feet first for the current version of the calculator." },
    ],
    calculatorUi: {
      fields: [
        createField("kitchenSize", "Kitchen Size (sq ft)"),
        createField("applianceTier", "Appliance Tier"),
      ],
      results: [createResult("estimatedCost", "Estimated Cost", "Includes cabinetry, countertops, labor, and {applianceTier} appliances.")],
    },
  },
  {
    id: "tool-bedroom-reno-calculator",
    category: "renovations",
    slug: "bedroom-reno-calculator",
    title: "Bedroom Renovation Estimator",
    description: "Calculate flooring, paint, and furnishing costs based on square footage.",
    seoTitle: "Bedroom Renovation Calculator | Mr. Props",
    seoDescription: "Estimate bedroom renovation costs by room size and finish quality.",
    mainTitle: "Estimate bedroom upgrade costs in minutes",
    introText: "Use this bedroom estimator to scope flooring, paint, furnishing, and finish upgrades without a spreadsheet.",
    benefits: [
      { title: "Quick Budget Range", description: "Set expectations before you start pricing furniture and trades." },
      { title: "Finish Comparison", description: "See how quality level changes the total budget." },
      { title: "Portfolio Planning", description: "Standardize bedroom refreshes across multiple units." },
    ],
    faqs: [
      { question: "What does finish quality mean?", answer: "It represents the overall material and furnishing tier, from basic refreshes to premium makeovers." },
    ],
    calculatorUi: {
      fields: [
        createField("roomSize", "Room Size (sq ft)"),
        createField("materialQuality", "Finish Quality", "Economy to Luxury"),
      ],
      results: [createResult("estimatedCost", "Estimated Cost", "Includes flooring, paint, furnishings, and labor based on national averages.")],
    },
  },
];

const TOOL_QUERY = `*[_type == "calculatorToolPage" && category == $category && slug.current == $slug][0]{
  _id,
  category,
  slug,
  title,
  description,
  seoTitle,
  seoDescription,
  mainTitle,
  introText,
  benefits[]{title,description},
  faqs[]{question,answer},
  body,
  calculatorUi{
    fields[]{key,label,helpText},
    results[]{key,label,helpText},
    layout{reportButtonLabel,primaryCtaLabel,primaryCtaHref,trustBadgeText,helpfulHeading,helpfulText,reportModalTitle,benefitStripItems[]{icon,title,description}}
  }
}`;

export async function fetchToolPage(category: string, slug: string) {
  const doc = await sanityFetch<SanityToolDoc | null>(TOOL_QUERY, { category, slug });
  if (!doc) return null;
  return normalizeToolDoc(doc);
}

function normalizeToolDoc(doc: SanityToolDoc): ToolPageContent {
  const fallback = getToolFallback(doc.category, doc.slug?.current) || toolFallbacks[0];
  return {
    ...fallback,
    id: doc._id,
    category: doc.category || fallback.category,
    slug: doc.slug?.current || fallback.slug,
    title: doc.title || fallback.title,
    description: doc.description || fallback.description,
    seoTitle: doc.seoTitle || fallback.seoTitle,
    seoDescription: doc.seoDescription || fallback.seoDescription,
    mainTitle: doc.mainTitle || fallback.mainTitle,
    introText: doc.introText || fallback.introText,
    benefits: doc.benefits?.length ? doc.benefits : fallback.benefits,
    faqs: doc.faqs?.length ? doc.faqs : fallback.faqs,
    body: doc.body?.length ? doc.body : fallback.body,
    calculatorUi: {
      fields: doc.calculatorUi?.fields?.length ? doc.calculatorUi.fields : fallback.calculatorUi?.fields,
      results: doc.calculatorUi?.results?.length ? doc.calculatorUi.results : fallback.calculatorUi?.results,
      layout: {
        ...fallback.calculatorUi?.layout,
        ...doc.calculatorUi?.layout,
      },
    },
  };
}

export function getToolFallback(category?: string | null, slug?: string | null) {
  return toolFallbacks.find((item) => item.category === category && item.slug === slug) || null;
}
