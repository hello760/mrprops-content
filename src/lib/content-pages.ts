import { cache } from "react";
import { calculateReadTime, formatDisplayDate, portableTextToPlainText, startCaseSlug, stripPrefix, type PortableTextBlock } from "@/lib/content-helpers";
import { sanityFetch } from "@/lib/sanity";

export interface LinkButtonConfig {
  label: string;
  href?: string;
}

export interface FAQItemConfig {
  question: string;
  answer: string;
}

export interface FeatureCardConfig {
  title: string;
  description: string;
}

export interface ComparisonTableRowConfig {
  feature: string;
  primaryValue?: string | boolean | null;
  secondaryValue?: string | boolean | null;
  mrPropsValue?: string | boolean | null;
}

export interface DirectoryEntry {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: PortableTextBlock[];
  seoTitle: string;
  seoDescription: string;
  publishedAt?: string;
  updatedAt?: string;
  image?: string;
  platform?: string;
  location?: string;
  region?: string;
  competitorName?: string;
  primaryItem?: string;
  secondaryItem?: string;
  updated: string;
  heroBadge?: string;
  heroTitle?: string;
  heroDescription?: string;
  comparisonSnapshotTitle?: string;
  tocTitle?: string;
  showdownBadge?: string;
  showdownTitle?: string;
  showdownDescription?: string;
  showdownButtonLabel?: string;
  comparisonTableRows?: ComparisonTableRowConfig[];
  alternativeCards?: FeatureCardConfig[];
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  migrationTitle?: string;
  migrationDescription?: string;
  migrationButtonLabel?: string;
  reviewedBadge?: string;
  taxChecklistTitle?: string;
  taxChecklistDescription?: string;
  taxChecklistButtonLabel?: string;
  taxIntroTitle?: string;
  taxIntroDescription?: string;
  taxOccupancyTitle?: string;
  taxOccupancyDescription?: string;
  calculatorTitle?: string;
  calculatorDescription?: string;
  calculatorButtonLabel?: string;
  importantDatesTitle?: string;
  importantDates?: Array<{ label: string; value: string }>;
  alertText?: string;
  statusLabel?: string;
  overviewTitle?: string;
  checklistTitle?: string;
  checklistItems?: string[];
  sidebarCtaTitle?: string;
  sidebarCtaDescription?: string;
  sidebarCtaButtonLabel?: string;
  definitionPrefix?: string;
  proTipBadge?: string;
  proTipTitle?: string;
  proTipDescription?: string;
  proTipButtonLabel?: string;
  faqTitle?: string;
  faqDescription?: string;
  faqs?: FAQItemConfig[];
  ctaTitle?: string;
  ctaText?: string;
  ctaPrimaryButton?: LinkButtonConfig;
  ctaSecondaryButton?: LinkButtonConfig;
}

export interface LandingContent {
  id: string;
  slug: string;
  pageType: "features" | "services";
  title: string;
  headline: string;
  subheadline: string;
  body: PortableTextBlock[];
  image: string;
  seoTitle: string;
  seoDescription: string;
  publishedAt?: string;
  updatedAt?: string;
  heroBadge?: string;
  primaryCtaButton?: LinkButtonConfig;
  secondaryCtaButton?: LinkButtonConfig;
  trustBarLabel?: string;
  trustBarLogos?: Array<{ label: string }>;
  spotlightTitle?: string;
  spotlightDescription?: string;
  spotlightApps?: Array<{ label: string }>;
  featuresTitle?: string;
  featuresDescription?: string;
  features?: FeatureCardConfig[];
  faqTitle?: string;
  faqDescription?: string;
  faqs?: FAQItemConfig[];
  ctaTitle?: string;
  ctaText?: string;
  ctaPrimaryButton?: LinkButtonConfig;
  ctaSecondaryButton?: LinkButtonConfig;
}

interface SanityDoc {
  _id: string;
  _type: string;
  category?: string;
  title?: string;
  headline?: string;
  subheadline?: string;
  term?: string;
  slug?: { current?: string };
  excerpt?: string;
  definition?: string;
  body?: PortableTextBlock[];
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
  _updatedAt?: string;
  imageUrl?: string;
  pageType?: "features" | "services";
  platform?: string;
  locationName?: string;
  regionName?: string;
  region?: string;
  competitorName?: string;
  primaryItem?: string;
  secondaryItem?: string;
  heroBadge?: string;
  heroTitle?: string;
  heroDescription?: string;
  comparisonSnapshotTitle?: string;
  tocTitle?: string;
  showdownBadge?: string;
  showdownTitle?: string;
  showdownDescription?: string;
  showdownButtonLabel?: string;
  comparisonTableRows?: ComparisonTableRowConfig[];
  alternativeCards?: FeatureCardConfig[];
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  migrationTitle?: string;
  migrationDescription?: string;
  migrationButtonLabel?: string;
  reviewedBadge?: string;
  taxChecklistTitle?: string;
  taxChecklistDescription?: string;
  taxChecklistButtonLabel?: string;
  taxIntroTitle?: string;
  taxIntroDescription?: string;
  taxOccupancyTitle?: string;
  taxOccupancyDescription?: string;
  calculatorTitle?: string;
  calculatorDescription?: string;
  calculatorButtonLabel?: string;
  importantDatesTitle?: string;
  importantDates?: Array<{ label?: string; value?: string }>;
  alertText?: string;
  statusLabel?: string;
  overviewTitle?: string;
  checklistTitle?: string;
  checklistItems?: string[];
  sidebarCtaTitle?: string;
  sidebarCtaDescription?: string;
  sidebarCtaButtonLabel?: string;
  definitionPrefix?: string;
  proTipBadge?: string;
  proTipTitle?: string;
  proTipDescription?: string;
  proTipButtonLabel?: string;
  faqTitle?: string;
  faqDescription?: string;
  faqs?: Array<{ question?: string; answer?: string }>;
  ctaTitle?: string;
  ctaText?: string;
  ctaPrimaryButton?: { label?: string; href?: string };
  ctaSecondaryButton?: { label?: string; href?: string };
  primaryCtaButton?: { label?: string; href?: string };
  secondaryCtaButton?: { label?: string; href?: string };
  trustBarLabel?: string;
  trustBarLogos?: Array<{ label?: string }>;
  spotlightTitle?: string;
  spotlightDescription?: string;
  spotlightApps?: Array<{ label?: string }>;
  featuresTitle?: string;
  featuresDescription?: string;
  features?: FeatureCardConfig[];
}

const DEFAULT_IMAGE = "/assets/MrProps_main_screen_1768972680323.png";
const DEFAULT_GUIDE_IMAGE = "/assets/generated_images/minimalist_finance_graph.png";
const DEFAULT_ALTERNATIVE_IMAGE = "/assets/generated_images/side_by_side_comparison_of_outdated_software_interface_versus_modern_clean_interface.png";
const DEFAULT_COMPARISON_IMAGE = "/assets/generated_images/head_to_head_boxing_match_style_vs_graphic_for_software.png";
const DEFAULT_PRICING_IMAGE = "/assets/generated_images/fragmented_software_stack_cost_equation_visual.png";
const FALLBACK_DATE = "Oct 24, 2025";

const BASE_PROJECTION = `{
  _id, _type, title, term, slug, excerpt, definition, body, seoTitle, seoDescription,
  publishedAt, updatedAt, headline, subheadline, pageType, category, platform, competitorName,
  primaryItem, secondaryItem, heroBadge, heroTitle, heroDescription, comparisonSnapshotTitle,
  tocTitle, showdownBadge, showdownTitle, showdownDescription, showdownButtonLabel,
  comparisonTableRows, alternativeCards, primaryCtaLabel, secondaryCtaLabel,
  migrationTitle, migrationDescription, migrationButtonLabel, reviewedBadge,
  taxChecklistTitle, taxChecklistDescription, taxChecklistButtonLabel,
  taxIntroTitle, taxIntroDescription, taxOccupancyTitle, taxOccupancyDescription,
  calculatorTitle, calculatorDescription, calculatorButtonLabel,
  importantDatesTitle, importantDates, alertText, statusLabel, overviewTitle,
  checklistTitle, checklistItems, sidebarCtaTitle, sidebarCtaDescription, sidebarCtaButtonLabel,
  definitionPrefix, proTipBadge, proTipTitle, proTipDescription, proTipButtonLabel,
  faqTitle, faqDescription, faqs, ctaTitle, ctaText, ctaPrimaryButton, ctaSecondaryButton,
  primaryCtaButton, secondaryCtaButton, trustBarLabel, trustBarLogos, spotlightTitle,
  spotlightDescription, spotlightApps, featuresTitle, featuresDescription, features,
  "imageUrl": coalesce(image.asset->url, heroImage.asset->url, coverImage.asset->url, featuredImage.asset->url),
  "locationName": coalesce(locationName, location, city, regionName, market, destination, title),
  "regionName": coalesce(regionName, region, state, country)
}`;

function normalizeSlug(slug?: string, prefix?: string) {
  if (!slug) return "";
  return prefix ? stripPrefix(slug, prefix) : slug;
}

function normalizeFaqs(faqs?: SanityDoc["faqs"]) {
  return (faqs || []).filter((item) => item?.question && item?.answer).map((item) => ({ question: item!.question!, answer: item!.answer! }));
}

function normalizeButtons(btn?: { label?: string; href?: string }) {
  return btn?.label ? { label: btn.label, href: btn.href } : undefined;
}

function defaultBody(text: string): PortableTextBlock[] {
  return [{ _key: "intro", _type: "block", style: "normal", children: [{ _type: "span", text }] }];
}

function dedupeBySlug<T extends { slug: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.slug || seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

function fallbackImageForSlug(slug: string) {
  if (slug.startsWith("templates/")) {
    const templateImages: Record<string, string> = {
      "templates/guest-experience/airbnb-welcome-book": "/assets/stock_images/airbnb_welcome_book__763d0d3b.jpg",
      "templates/legal/house-rules-template": "/assets/stock_images/house_rules_document_4cf60d5b.jpg",
      "templates/operations/cleaning-checklist": "/assets/stock_images/cleaning_checklist_o_083d553b.jpg",
      "templates/operations/inventory-tracker": "/assets/stock_images/inventory_list_for_r_c0f0808d.jpg",
      "templates/guest-experience/guest-message-scripts": "/assets/stock_images/smartphone_showing_g_796edb1e.jpg",
      "templates/legal/rental-agreement": "/assets/stock_images/rental_agreement_con_73f69648.jpg",
      "templates/marketing/listing-optimization-guide": "/assets/stock_images/laptop_showing_listi_245cd225.jpg",
      "templates/legal/co-host-contract": "/assets/stock_images/contract_document_fo_9ff75724.jpg",
      "templates/operations/pricing-strategy-calculator": "/assets/stock_images/calculator_and_finan_e5a6228f.jpg",
      "templates/guest-experience/amenities-checklist": "/assets/stock_images/list_of_amenities_fo_77f0028e.jpg",
    };
    return templateImages[slug] || DEFAULT_IMAGE;
  }

  if (slug.startsWith("compare/")) return DEFAULT_COMPARISON_IMAGE;
  if (slug.startsWith("alternatives/")) return DEFAULT_ALTERNATIVE_IMAGE;
  if (slug.startsWith("guides/")) return DEFAULT_GUIDE_IMAGE;
  if (slug.includes("pricing")) return DEFAULT_PRICING_IMAGE;
  return DEFAULT_IMAGE;
}

function normalizeDirectoryDoc(doc: SanityDoc, prefix?: string): DirectoryEntry {
  const slug = normalizeSlug(doc.slug?.current, prefix) || doc._id;
  const title = doc.title || startCaseSlug(slug);
  const excerpt = doc.excerpt || doc.seoDescription || doc.definition || portableTextToPlainText(doc.body).slice(0, 180) || `${title} | Mr. Props`;
  const body = doc.body?.length ? doc.body : defaultBody(excerpt);
  return {
    id: doc._id,
    slug,
    title,
    excerpt,
    body,
    seoTitle: doc.seoTitle || `${title} | Mr. Props`,
    seoDescription: doc.seoDescription || excerpt,
    publishedAt: doc.publishedAt,
    updatedAt: doc._updatedAt || doc.publishedAt,
    image: doc.imageUrl || fallbackImageForSlug(slug),
    platform: doc.platform?.toLowerCase(),
    location: doc.locationName,
    region: (doc.regionName || "global").toLowerCase().replace(/\s+/g, "-"),
    competitorName: doc.competitorName,
    primaryItem: doc.primaryItem,
    secondaryItem: doc.secondaryItem,
    updated: formatDisplayDate(doc._updatedAt || doc.publishedAt),
    heroBadge: doc.heroBadge,
    heroTitle: doc.heroTitle,
    heroDescription: doc.heroDescription,
    comparisonSnapshotTitle: doc.comparisonSnapshotTitle,
    tocTitle: doc.tocTitle,
    showdownBadge: doc.showdownBadge,
    showdownTitle: doc.showdownTitle,
    showdownDescription: doc.showdownDescription,
    showdownButtonLabel: doc.showdownButtonLabel,
    comparisonTableRows: doc.comparisonTableRows,
    alternativeCards: doc.alternativeCards,
    primaryCtaLabel: doc.primaryCtaLabel,
    secondaryCtaLabel: doc.secondaryCtaLabel,
    migrationTitle: doc.migrationTitle,
    migrationDescription: doc.migrationDescription,
    migrationButtonLabel: doc.migrationButtonLabel,
    reviewedBadge: doc.reviewedBadge,
    taxChecklistTitle: doc.taxChecklistTitle,
    taxChecklistDescription: doc.taxChecklistDescription,
    taxChecklistButtonLabel: doc.taxChecklistButtonLabel,
    taxIntroTitle: doc.taxIntroTitle,
    taxIntroDescription: doc.taxIntroDescription,
    taxOccupancyTitle: doc.taxOccupancyTitle,
    taxOccupancyDescription: doc.taxOccupancyDescription,
    calculatorTitle: doc.calculatorTitle,
    calculatorDescription: doc.calculatorDescription,
    calculatorButtonLabel: doc.calculatorButtonLabel,
    importantDatesTitle: doc.importantDatesTitle,
    importantDates: (doc.importantDates || []).map((item) => ({ label: item.label || "Date", value: item.value || "TBD" })),
    alertText: doc.alertText,
    statusLabel: doc.statusLabel,
    overviewTitle: doc.overviewTitle,
    checklistTitle: doc.checklistTitle,
    checklistItems: doc.checklistItems,
    sidebarCtaTitle: doc.sidebarCtaTitle,
    sidebarCtaDescription: doc.sidebarCtaDescription,
    sidebarCtaButtonLabel: doc.sidebarCtaButtonLabel,
    definitionPrefix: doc.definitionPrefix,
    proTipBadge: doc.proTipBadge,
    proTipTitle: doc.proTipTitle,
    proTipDescription: doc.proTipDescription,
    proTipButtonLabel: doc.proTipButtonLabel,
    faqTitle: doc.faqTitle,
    faqDescription: doc.faqDescription,
    faqs: normalizeFaqs(doc.faqs),
    ctaTitle: doc.ctaTitle,
    ctaText: doc.ctaText,
    ctaPrimaryButton: normalizeButtons(doc.ctaPrimaryButton),
    ctaSecondaryButton: normalizeButtons(doc.ctaSecondaryButton),
  };
}

function normalizeLandingDoc(doc: SanityDoc): LandingContent {
  const title = doc.title || doc.headline || "Mr. Props";
  const body = doc.body?.length ? doc.body : defaultBody(doc.excerpt || doc.subheadline || title);
  return {
    id: doc._id,
    slug: stripPrefix(doc.slug?.current || doc._id, doc.pageType || ""),
    pageType: doc.pageType || "features",
    title,
    headline: doc.headline || title,
    subheadline: doc.subheadline || doc.excerpt || "Modern property management for modern hosts.",
    body,
    image: doc.imageUrl || "/assets/MrProps_main_screen_1768972680323.png",
    seoTitle: doc.seoTitle || `${title} | Mr. Props`,
    seoDescription: doc.seoDescription || doc.excerpt || portableTextToPlainText(body).slice(0, 160),
    publishedAt: doc.publishedAt,
    updatedAt: doc._updatedAt || doc.publishedAt,
    heroBadge: doc.heroBadge,
    primaryCtaButton: normalizeButtons(doc.primaryCtaButton),
    secondaryCtaButton: normalizeButtons(doc.secondaryCtaButton),
    trustBarLabel: doc.trustBarLabel,
    trustBarLogos: (doc.trustBarLogos || []).map((item) => ({ label: item.label || "Trusted" })),
    spotlightTitle: doc.spotlightTitle,
    spotlightDescription: doc.spotlightDescription,
    spotlightApps: (doc.spotlightApps || []).map((item) => ({ label: item.label || "App" })),
    featuresTitle: doc.featuresTitle,
    featuresDescription: doc.featuresDescription,
    features: doc.features,
    faqTitle: doc.faqTitle,
    faqDescription: doc.faqDescription,
    faqs: normalizeFaqs(doc.faqs),
    ctaTitle: doc.ctaTitle,
    ctaText: doc.ctaText,
    ctaPrimaryButton: normalizeButtons(doc.ctaPrimaryButton),
    ctaSecondaryButton: normalizeButtons(doc.ctaSecondaryButton),
  };
}

const templateFallbacks: DirectoryEntry[] = [
  ["guest-experience", "airbnb-welcome-book", "Airbnb Welcome Book"],
  ["legal", "house-rules-template", "House Rules Template"],
  ["operations", "cleaning-checklist", "Cleaning Checklist"],
  ["operations", "inventory-tracker", "Inventory Tracker"],
  ["guest-experience", "guest-message-scripts", "Guest Message Scripts"],
  ["legal", "rental-agreement", "Short-Term Rental Agreement"],
  ["marketing", "listing-optimization-guide", "Listing Optimization Guide"],
  ["legal", "co-host-contract", "Co-Hosting Contract"],
  ["operations", "pricing-strategy-calculator", "Pricing Strategy Calculator"],
  ["guest-experience", "amenities-checklist", "Essential Amenities List"],
].map(([category, slug, title]) => ({
  id: `template-${slug}`,
  slug: `templates/${category}/${slug}`,
  title,
  excerpt: `Free ${title.toLowerCase()} template for short-term rental hosts and property managers.`,
  body: defaultBody(`Download the ${title.toLowerCase()} and customize it for your short-term rental operation.`),
  seoTitle: `${title} | Mr. Props`,
  seoDescription: `Download the ${title.toLowerCase()} and customize it for your short-term rental operation.`,
  image: fallbackImageForSlug(`templates/${category}/${slug}`),
  updated: FALLBACK_DATE,
  publishedAt: "2025-10-24",
  updatedAt: "2025-10-24",
  faqTitle: "Frequently Asked Questions",
  faqs: [
    { question: "Can I customize this template?", answer: "Yes. Download it, edit it, and adapt it to your operation." },
    { question: "Is it free?", answer: "Yes. These template pages are available as free resources for hosts." },
  ],
  ctaTitle: "Want the full operating system?",
  ctaText: "Use Mr. Props to turn scattered SOPs, files, and checklists into one repeatable workflow.",
  ctaPrimaryButton: { label: "Start Free Trial", href: "https://app.mrprops.io/register" },
  ctaSecondaryButton: { label: "See Pricing", href: "/pricing" },
}));

const toolFallbacks: DirectoryEntry[] = [
  {
    id: "tool-rental-yield-calculator",
    slug: "tools/finance/rental-yield-calculator",
    title: "Rental Yield Calculator",
    excerpt: "Calculate gross and net rental yields for your investment property instantly.",
    body: defaultBody("Calculate gross and net rental yields for your investment property. Essential for property investors and short-term rental operators."),
    seoTitle: "Rental Yield Calculator | Mr. Props",
    seoDescription: "Calculate gross and net rental yields for your investment property. Essential for property investors.",
    image: DEFAULT_IMAGE,
    updated: FALLBACK_DATE,
    publishedAt: "2025-10-24",
    updatedAt: "2025-10-24",
    faqTitle: "Rental Yield FAQ",
    faqs: [
      { question: "What is gross yield?", answer: "Gross yield is annual rent divided by purchase price, before expenses." },
      { question: "What is net yield?", answer: "Net yield subtracts annual expenses before calculating the return percentage." },
    ],
    ctaTitle: "Turn yield into actual performance",
    ctaText: "Track revenue, occupancy, and operating costs in one place with Mr. Props.",
    ctaPrimaryButton: { label: "Start Free Trial", href: "https://app.mrprops.io/register" },
  },
  {
    id: "tool-renovation-calculator",
    slug: "tools/renovations/renovation-calculator",
    title: "Renovation ROI Calculator",
    excerpt: "Calculate the return on investment for rental property renovations.",
    body: defaultBody("Calculate the return on investment for your rental property renovations so you can prioritize upgrades that actually move ADR, occupancy, and payback period."),
    seoTitle: "Renovation ROI Calculator | Mr. Props",
    seoDescription: "Calculate the return on investment for your rental property renovations. Make data-driven decisions.",
    image: DEFAULT_IMAGE,
    updated: FALLBACK_DATE,
    publishedAt: "2025-10-24",
    updatedAt: "2025-10-24",
    faqTitle: "Renovation ROI FAQ",
    faqs: [
      { question: "Which upgrades usually pay back fastest?", answer: "High-visibility upgrades like design, photography, hot tubs, and kitchen refreshes often produce the clearest ROI." },
      { question: "Should I include financing cost?", answer: "Yes. If the project is debt-funded, include the cost of capital in your analysis." },
    ],
    ctaTitle: "Plan smarter capex",
    ctaText: "Benchmark projects, performance, and payback across your portfolio with Mr. Props.",
    ctaPrimaryButton: { label: "Start Free Trial", href: "https://app.mrprops.io/register" },
  },
  {
    id: "tool-airbnb-profit-calculator",
    slug: "tools/booking/airbnb-profit-calculator",
    title: "Airbnb Profit Calculator",
    excerpt: "Estimate revenue, expenses, and ROI for your short-term rental.",
    body: defaultBody("Use this calculator to estimate revenue, expenses, and profit margin for your short-term rental."),
    seoTitle: "Airbnb Profit Calculator 2026 | Mr. Props",
    seoDescription: "Free Airbnb profit calculator. Estimate revenue, expenses, and ROI for your short-term rental property.",
    image: DEFAULT_IMAGE,
    updated: FALLBACK_DATE,
    publishedAt: "2025-10-24",
    updatedAt: "2025-10-24",
  },
  {
    id: "tool-cleaning-fee-calculator",
    slug: "tools/operations/cleaning-fee-calculator",
    title: "Cleaning Fee Calculator",
    excerpt: "Set a profitable cleaning fee without hurting conversion.",
    body: defaultBody("Balance labor, linen, and reset costs against guest conversion with a pricing model that protects margin."),
    seoTitle: "Cleaning Fee Calculator | Mr. Props",
    seoDescription: "Estimate the right guest-facing cleaning fee for your short-term rental.",
    image: DEFAULT_IMAGE,
    updated: FALLBACK_DATE,
    publishedAt: "2025-10-24",
    updatedAt: "2025-10-24",
  },
];

const landingFallbacks: LandingContent[] = [
  {
    id: "landing-unified-inbox",
    slug: "unified-inbox",
    pageType: "features",
    title: "Unified Inbox",
    headline: "Automate Your Unified Inbox",
    subheadline: "Centralize guest communication and reduce context switching across Airbnb, Booking.com, and direct bookings.",
    body: defaultBody("Centralize guest communication and reduce context switching across Airbnb, Booking.com, and direct bookings."),
    image: "/assets/MrProps_main_screen_1768972680323.png",
    seoTitle: "Unified Inbox for Property Managers | Mr. Props",
    seoDescription: "Centralize guest communication and reduce context switching across channels.",
    heroBadge: "Feature",
    faqTitle: "Unified Inbox FAQ",
    faqs: [
      { question: "What channels can I unify?", answer: "Airbnb, Booking.com, email, WhatsApp, and direct booking flows." },
      { question: "Why does this matter?", answer: "A single inbox reduces missed messages, slow replies, and context switching for your team." },
    ],
    ctaTitle: "See your guest ops in one place",
    ctaText: "Bring messaging, operations, and follow-up into a single workflow with Mr. Props.",
    ctaPrimaryButton: { label: "Start Free Trial", href: "https://app.mrprops.io/register" },
  },
  {
    id: "landing-property-managers",
    slug: "property-managers",
    pageType: "services",
    title: "For Property Managers",
    headline: "Built for Operators Managing Real Portfolios",
    subheadline: "Run a tighter operation with messaging, cleaning, reporting, and compliance in one workflow.",
    body: defaultBody("Run a tighter operation with messaging, cleaning, reporting, and compliance in one workflow."),
    image: "/assets/MrProps_main_screen_1768972680323.png",
    seoTitle: "Property Management Software for Operators | Mr. Props",
    seoDescription: "Run a tighter operation with messaging, cleaning, reporting, and compliance in one workflow.",
    heroBadge: "Service",
    faqTitle: "Property Manager FAQ",
    faqs: [
      { question: "Who is this for?", answer: "Property managers, co-hosting teams, and operators running multiple listings or portfolios." },
      { question: "What problems does it solve?", answer: "Operational drag across guest messaging, turnovers, owner reporting, and compliance tasks." },
    ],
    ctaTitle: "Run a tighter portfolio",
    ctaText: "Replace scattered tools and manual follow-ups with a single operating layer.",
    ctaPrimaryButton: { label: "Start Free Trial", href: "https://app.mrprops.io/register" },
  },
];

const fetchByType = cache(async (types: string[]) => {
  const typeFilter = types.map((t) => `_type == "${t}"`).join(" || ");
  return sanityFetch<SanityDoc[]>(`*[(${typeFilter}) && defined(slug.current)]|order(coalesce(publishedAt, _updatedAt) desc){
    ${BASE_PROJECTION.slice(1, -1)},
    _updatedAt
  }`);
});

export const fetchLandingPages = cache(async (pageType: "features" | "services") => {
  const docs = await fetchByType(["landingPage", "contentPage", "featurePage", "servicePage"]);
  const sanityPages = docs
    .filter((doc) => (doc.pageType || (doc.slug?.current?.startsWith("services/") ? "services" : "features")) === pageType)
    .map(normalizeLandingDoc);
  return dedupeBySlug([...sanityPages, ...landingFallbacks.filter((item) => item.pageType === pageType)]);
});

export const fetchLandingPageBySlug = cache(async (pageType: "features" | "services", slug: string) => {
  const pages = await fetchLandingPages(pageType);
  return pages.find((item) => item.slug === slug) || landingFallbacks.find((item) => item.pageType === pageType) || null;
});

export const fetchComparisons = cache(async () => {
  const docs = await fetchByType(["competitorComparison", "comparisonPage", "comparison"]);
  return docs.map((doc) => normalizeDirectoryDoc(doc, "compare"));
});

export const fetchAlternatives = cache(async () => {
  const docs = await fetchByType(["competitorAlternative", "alternativePage", "alternative"]);
  return docs.map((doc) => normalizeDirectoryDoc(doc, "alternatives"));
});

export const fetchRegulations = cache(async () => {
  const docs = await fetchByType(["regulationPage", "regulation", "regulations"]);
  return docs.map((doc) => normalizeDirectoryDoc(doc, "regulations"));
});

export const fetchTaxes = cache(async () => {
  const docs = await fetchByType(["taxPage", "taxGuide", "taxes"]);
  return docs.map((doc) => normalizeDirectoryDoc(doc, "taxes"));
});

export const fetchTemplates = cache(async () => {
  const docs = await fetchByType(["leadGenTemplatePage", "leadGenTemplate", "templatePage", "template"]);
  const sanityPages = docs.map((doc) => normalizeDirectoryDoc({
    ...doc,
    slug: { current: `templates/${doc.category || "general"}/${stripPrefix(doc.slug?.current || doc._id, "templates")}` },
  }, "templates"));
  return dedupeBySlug([...sanityPages, ...templateFallbacks]);
});

export const fetchTools = cache(async () => {
  const docs = await fetchByType(["calculatorToolPage", "calculatorTool", "toolPage", "tool"]);
  const sanityPages = docs.map((doc) => normalizeDirectoryDoc({
    ...doc,
    slug: { current: `tools/${doc.category || "general"}/${stripPrefix(doc.slug?.current || doc._id, "tools")}` },
  }, "tools"));
  return dedupeBySlug([...sanityPages, ...toolFallbacks]);
});

export const fetchGuides = cache(async () => {
  const docs = await fetchByType(["guide", "post"]);
  return docs.map((doc) => {
    const item = normalizeDirectoryDoc(doc, "guides");
    return {
      ...item,
      date: formatDisplayDate(doc.publishedAt),
      readTime: calculateReadTime(portableTextToPlainText(item.body) || item.excerpt),
    };
  });
});

export const fetchGuideBySlug = cache(async (slug: string) => {
  const cleanSlug = stripPrefix(slug, "guides");
  const doc = await sanityFetch<SanityDoc | null>(`*[_type in ["guide", "post"] && defined(slug.current) && slug.current in [$slug, $prefixedSlug, $baseSlug, $prefixedBaseSlug]][0]{
    ${BASE_PROJECTION.slice(1, -1)},
    _updatedAt
  }`, {
    slug,
    prefixedSlug: `guides/${cleanSlug}`,
    baseSlug: cleanSlug,
    prefixedBaseSlug: `guides/${stripPrefix(cleanSlug, "guides")}`,
  });

  if (!doc) return null;

  const item = normalizeDirectoryDoc(doc, "guides");
  return {
    ...item,
    date: formatDisplayDate(doc.publishedAt),
    readTime: calculateReadTime(portableTextToPlainText(item.body) || item.excerpt),
  };
});

export function splitNestedSlug(fullSlug: string, prefix: string, expectedDepth: number) {
  const clean = stripPrefix(fullSlug, prefix);
  const parts = clean.split("/").filter(Boolean);
  return parts.slice(0, expectedDepth);
}
