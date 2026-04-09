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

const DEFAULT_IMAGE = "/og-image.png";
const BASE_PROJECTION = `{
  _id, _type, title, term, slug, excerpt, definition, body, seoTitle, seoDescription,
  publishedAt, updatedAt, headline, subheadline, pageType, platform, competitorName,
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
    image: doc.imageUrl || DEFAULT_IMAGE,
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
    image: doc.imageUrl || DEFAULT_IMAGE,
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

async function queryDocs(filter: string, params: Record<string, unknown> = {}) {
  return sanityFetch<SanityDoc[]>(`*[$filter]`, { filter, ...params } as never);
}

const fetchByType = cache(async (types: string[]) => {
  const typeFilter = types.map((t) => `_type == "${t}"`).join(" || ");
  return sanityFetch<SanityDoc[]>(`*[(${typeFilter}) && defined(slug.current)]|order(coalesce(publishedAt, _updatedAt) desc){
    ${BASE_PROJECTION.slice(1, -1)},
    _updatedAt
  }`);
});

export const fetchLandingPages = cache(async (pageType: "features" | "services") => {
  const docs = await fetchByType(["landingPage", "contentPage", "featurePage", "servicePage"]);
  return docs.filter((doc) => (doc.pageType || (doc.slug?.current?.startsWith("services/") ? "services" : "features")) === pageType).map(normalizeLandingDoc);
});

export const fetchLandingPageBySlug = cache(async (pageType: "features" | "services", slug: string) => {
  const pages = await fetchLandingPages(pageType);
  return pages.find((item) => item.slug === slug || item.slug === `${pageType}/${slug}`.replace(`${pageType}/`, "")) || null;
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
  const docs = await fetchByType(["leadGenTemplate", "templatePage", "template"]);
  return docs.map((doc) => normalizeDirectoryDoc(doc, "templates"));
});

export const fetchTools = cache(async () => {
  const docs = await fetchByType(["calculatorTool", "toolPage", "tool"]);
  return docs.map((doc) => normalizeDirectoryDoc(doc, "tools"));
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
  const guides = await fetchGuides();
  return guides.find((item) => item.slug === slug) || null;
});

export function splitNestedSlug(fullSlug: string, prefix: string, expectedDepth: number) {
  const clean = stripPrefix(fullSlug, prefix);
  const parts = clean.split("/").filter(Boolean);
  return parts.slice(0, expectedDepth);
}
