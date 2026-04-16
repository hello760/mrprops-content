import { cache } from "react";
import { calculateReadTime, formatDisplayDate, portableTextToPlainText, startCaseSlug, stripPrefix, type PortableTextBlock } from "@/lib/content-helpers";
// Sanity removed — all content served from Supabase

// ─── Supabase dual-source (Phase 4E) ─────────────────────────────────────────
let _sbClient: any = null;
async function getSB() {
  if (_sbClient) return _sbClient;
  if (!process.env.SUPABASE_URL || !(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '')) return null;
  const { createClient } = await import('@supabase/supabase-js');
  _sbClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '');
  return _sbClient;
}

// ─── Supabase listing helper (for index/listing pages) ──────────────────────
async function fetchSupabaseListings(slugPrefix: string): Promise<DirectoryEntry[]> {
  const sb = await getSB();
  if (!sb || !process.env.MR_PROPS_CLIENT_ID) return [];

  const { data, error } = await sb
    .from('content_pieces')
    .select('id, custom_slug, title, type_of_work, content_body, structured_data, seo_title, meta_description, published_at, updated_at')
    .eq('client_id', process.env.MR_PROPS_CLIENT_ID)
    .eq('writing_status', 'published')
    .not('content_body', 'is', null)
    .like('custom_slug', `${slugPrefix}/%`)
    .order('published_at', { ascending: false });

  if (error || !data) return [];

  return data
    .filter((r: any) => r.custom_slug && !/-\d{8,}$/.test(r.custom_slug))
    .map((r: any) => {
      const sd = (r.structured_data || {}) as Record<string, any>;
      const bodyHtml = (r.content_body || '') as string;
      const plainText = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      return {
        id: r.id,
        slug: r.custom_slug,
        title: sd.heroTitle || sd.title || r.title || startCaseSlug(r.custom_slug),
        excerpt: sd.seoDescription || r.meta_description || plainText.slice(0, 180) || '',
        body: [],
        bodyHtml,
        seoTitle: sd.seoTitle || r.seo_title || `${r.title} | Mr. Props`,
        seoDescription: sd.seoDescription || r.meta_description || '',
        publishedAt: r.published_at,
        updatedAt: r.updated_at || r.published_at,
        image: sd.conceptImage?.url || fallbackImageForSlug(r.custom_slug),
        platform: sd.platform,
        location: sd.location,
        region: sd.region,
        competitorName: sd.competitorName,
        heroBadge: sd.heroBadge,
        heroTitle: sd.heroTitle,
        heroDescription: sd.heroDescription,
        comparisonTableRows: sd.comparisonTableRows,
        alternativeCards: sd.alternativeCards,
        faqs: sd.faqs,
        updated: formatDisplayDate(r.updated_at || r.published_at),
      } as DirectoryEntry;
    });
}

async function fetchLandingFromSupabase(pageType: "features" | "services", slug: string): Promise<LandingContent | null> {
  const sb = await getSB();
  if (!sb || !process.env.MR_PROPS_CLIENT_ID) return null;

  const slugVariants = [`${pageType}/${slug}`, `features/${slug}`, `services/${slug}`, slug];
  const { data, error } = await sb
    .from('content_pieces')
    .select('id, custom_slug, title, type_of_work, content_body, structured_data, seo_title, meta_description, published_at')
    .eq('client_id', process.env.MR_PROPS_CLIENT_ID)
    .eq('writing_status', 'published')
    .not('structured_data', 'is', null)
    .in('custom_slug', slugVariants)
    .single();

  if (error || !data?.structured_data) return null;
  const sd = data.structured_data as Record<string, any>;

  return {
    id: data.id,
    slug,
    pageType,
    title: sd.hero?.headline || data.title || '',
    headline: sd.hero?.headline || data.title || '',
    subheadline: sd.hero?.subheadline || '',
    body: [],
    bodyHtml: data.content_body || undefined,
    image: '',
    seoTitle: sd.seoTitle || data.seo_title || '',
    seoDescription: sd.seoDescription || data.meta_description || '',
    publishedAt: data.published_at || undefined,
    heroBadge: sd.hero?.badge,
    primaryCtaButton: sd.hero?.primaryCta,
    secondaryCtaButton: sd.hero?.secondaryCta,
    trustBarLabel: sd.trustBar?.label,
    trustBarLogos: sd.trustBar?.logos?.map((l: string) => ({ label: l })),
    spotlightTitle: sd.spotlight?.title,
    spotlightDescription: sd.spotlight?.description,
    featuresTitle: 'Why Choose Mr. Props?',
    features: sd.features,
    statsBar: sd.statsBar,
    howItWorksTitle: 'How It Works',
    howItWorksSteps: sd.howItWorks,
    comparisonTitle: sd.comparison?.title,
    comparisonPros: sd.comparison?.mrProps?.pros,
    comparisonCons: sd.comparison?.traditional?.cons,
    testimonialsTitle: 'What Our Customers Say',
    testimonials: sd.testimonials,
    faqTitle: 'Frequently Asked Questions',
    faqs: sd.faqs,
    ctaTitle: sd.finalCta?.headline,
    ctaText: sd.finalCta?.sentence,
    ctaPrimaryButton: sd.finalCta?.primaryCta,
    ctaSecondaryButton: sd.finalCta?.secondaryCta,
  };
}

// ─── Phase 10: Supabase dual-source for ALL remaining content types ──────────

async function fetchDirectoryEntryFromSupabase(urlPrefix: string, slug: string): Promise<DirectoryEntry | null> {
  const sb = await getSB();
  if (!sb || !process.env.MR_PROPS_CLIENT_ID) return null;

  // Build slug variants to match different storage patterns
  const cleanSlug = slug.replace(new RegExp(`^${urlPrefix}/`), '');
  const slugVariants = [`${urlPrefix}/${cleanSlug}`, cleanSlug, slug];

  const { data: rawData, error } = await sb
    .from('content_pieces')
    .select('id, custom_slug, title, type_of_work, content_body, structured_data, seo_title, meta_description, published_at')
    .eq('client_id', process.env.MR_PROPS_CLIENT_ID)
    .eq('writing_status', 'published')
    .not('structured_data', 'is', null)
    .in('custom_slug', slugVariants)
    .single();

  const data = rawData as Record<string, any> | null;
  if (error || !data || !data.structured_data) return null;

  const sd = data.structured_data as Record<string, any>;
  const bodyHtml = (data.content_body || '') as string;
  const plainText = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  return {
    id: data.id,
    slug: cleanSlug,
    title: sd.heroTitle || sd.title || data.title || '',
    excerpt: sd.seoDescription || data.meta_description || '',
    body: [],
    bodyHtml: bodyHtml || undefined,
    seoTitle: sd.seoTitle || data.seo_title || '',
    seoDescription: sd.seoDescription || data.meta_description || '',
    publishedAt: data.published_at || undefined,
    updatedAt: data.published_at || undefined,
    updated: formatDisplayDate(data.published_at),
    image: sd.featuredImage || undefined,
    // Type-specific fields from structured_data
    platform: sd.platform || undefined,
    location: sd.location || undefined,
    region: sd.region || undefined,
    competitorName: sd.competitorName || undefined,
    primaryItem: sd.primaryItem || undefined,
    secondaryItem: sd.secondaryItem || undefined,
    heroBadge: sd.heroBadge || sd.hero?.badge || undefined,
    heroTitle: sd.heroTitle || sd.hero?.headline || undefined,
    heroDescription: sd.heroDescription || sd.hero?.subheadline || undefined,
    // Comparison fields
    comparisonSnapshotTitle: sd.comparisonSnapshotTitle || undefined,
    showdownBadge: sd.showdownBadge || undefined,
    showdownTitle: sd.showdownTitle || undefined,
    showdownDescription: sd.showdownDescription || undefined,
    showdownButtonLabel: sd.showdownButtonLabel || undefined,
    comparisonTableRows: sd.comparisonTableRows || undefined,
    alternativeCards: sd.alternativeCards || undefined,
    primaryCtaLabel: sd.primaryCtaLabel || undefined,
    secondaryCtaLabel: sd.secondaryCtaLabel || undefined,
    migrationTitle: sd.migrationTitle || undefined,
    migrationDescription: sd.migrationDescription || undefined,
    migrationButtonLabel: sd.migrationButtonLabel || undefined,
    // Tax fields
    taxChecklistTitle: sd.taxChecklistTitle || undefined,
    taxChecklistDescription: sd.taxChecklistDescription || undefined,
    taxChecklistButtonLabel: sd.taxChecklistButtonLabel || undefined,
    taxIntroTitle: sd.taxIntroTitle || undefined,
    taxIntroDescription: sd.taxIntroDescription || undefined,
    alertText: sd.alertText || undefined,
    statusLabel: sd.statusLabel || undefined,
    importantDatesTitle: sd.importantDatesTitle || undefined,
    importantDates: sd.importantDates || undefined,
    // Regulation fields
    overviewTitle: sd.overviewTitle || undefined,
    checklistTitle: sd.checklistTitle || undefined,
    checklistItems: sd.checklistItems || undefined,
    // Sidebar CTA
    sidebarCtaTitle: sd.sidebarCtaTitle || undefined,
    sidebarCtaDescription: sd.sidebarCtaDescription || undefined,
    sidebarCtaButtonLabel: sd.sidebarCtaButtonLabel || undefined,
    // FAQ
    faqTitle: sd.faqTitle || 'Frequently Asked Questions',
    faqs: sd.faqs || [],
    ctaTitle: sd.ctaTitle || sd.finalCta?.headline || undefined,
    ctaText: sd.ctaText || sd.finalCta?.sentence || undefined,
  } as DirectoryEntry;
}

// Dedicated fetch-by-slug functions that check Supabase first
export async function fetchTaxBySlug(platform: string, region: string): Promise<DirectoryEntry | null> {
  const supabaseResult = await fetchDirectoryEntryFromSupabase('taxes', `${platform}/${region}`);
  if (supabaseResult) return { ...supabaseResult, platform, region };
  // Fallback: search full listing
  const pages = await fetchTaxes();
  return pages.find((item) => {
    const p = item.platform?.toLowerCase() || '';
    const r = item.region?.toLowerCase() || '';
    return (p === platform.toLowerCase() && r === region.toLowerCase()) || item.slug === `${platform}/${region}`;
  }) || null;
}

export async function fetchComparisonBySlug(slug: string): Promise<DirectoryEntry | null> {
  const supabaseResult = await fetchDirectoryEntryFromSupabase('compare', slug);
  if (supabaseResult) return supabaseResult;
  const pages = await fetchComparisons();
  return pages.find((item) => item.slug === slug) || null;
}

export async function fetchAlternativeBySlug(competitor: string): Promise<DirectoryEntry | null> {
  const supabaseResult = await fetchDirectoryEntryFromSupabase('alternatives', competitor);
  if (supabaseResult) return supabaseResult;
  const pages = await fetchAlternatives();
  return pages.find((item) => item.slug === competitor) || null;
}

export async function fetchRegulationBySlug(platform: string, location: string): Promise<DirectoryEntry | null> {
  const supabaseResult = await fetchDirectoryEntryFromSupabase('regulations', `${platform}/${location}`);
  if (supabaseResult) return { ...supabaseResult, platform, location };
  const pages = await fetchRegulations();
  return pages.find((item) => {
    const p = item.platform?.toLowerCase() || '';
    const l = item.location?.toLowerCase()?.replace(/\s+/g, '-') || '';
    return (p === platform.toLowerCase() && l === location.toLowerCase()) || item.slug === `${platform}/${location}`;
  }) || null;
}

// fetchGuideBySlug already exists — add Supabase check to it (done below in the function)

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
  checklistItems?: (string | { label: string; checked?: boolean })[];
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
  bodyHtml?: string;
  // Template-specific fields (leadGenTemplatePage)
  badge?: string;
  description?: string;
  trustItems?: string[];
  previewTitle?: string;
  previewMeta?: string;
  previewBody?: PortableTextBlock[];
  gateTitle?: string;
  gateDescription?: string;
  formPlaceholder?: string;
  formButtonLabel?: string;
  formDisclaimer?: string;
  whatIsTitle?: string;
  whatIsText?: string;
  useCasesTitle?: string;
  useCases?: string[];
  customizeTitle?: string;
  customizeText?: string;
  resourcesTitle?: string;
  resources?: Array<{ href: string; label: string; meta?: string }>;
}

export interface StatItemConfig {
  value: string;
  label: string;
}

export interface StepItemConfig {
  title: string;
  description: string;
}

export interface TestimonialConfig {
  quote: string;
  name: string;
  role?: string;
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
  statsBar?: StatItemConfig[];
  howItWorksTitle?: string;
  howItWorksSteps?: StepItemConfig[];
  comparisonTitle?: string;
  comparisonDescription?: string;
  comparisonPros?: string[];
  comparisonCons?: string[];
  testimonialsTitle?: string;
  testimonials?: TestimonialConfig[];
  faqTitle?: string;
  faqDescription?: string;
  faqs?: FAQItemConfig[];
  ctaTitle?: string;
  ctaText?: string;
  ctaPrimaryButton?: LinkButtonConfig;
  ctaSecondaryButton?: LinkButtonConfig;
  bodyHtml?: string;
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
  checklistItems?: (string | { label: string; checked?: boolean })[];
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
  // Template-specific fields (leadGenTemplatePage)
  badge?: string;
  description?: string;
  trustItems?: string[];
  previewTitle?: string;
  previewMeta?: string;
  previewBody?: PortableTextBlock[];
  gateTitle?: string;
  gateDescription?: string;
  formPlaceholder?: string;
  formButtonLabel?: string;
  formDisclaimer?: string;
  whatIsTitle?: string;
  whatIsText?: string;
  useCasesTitle?: string;
  useCases?: string[];
  customizeTitle?: string;
  customizeText?: string;
  resourcesTitle?: string;
  resources?: Array<{ href?: string; label?: string; meta?: string }>;
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
  statsBar?: Array<{ value?: string; label?: string }>;
  howItWorksTitle?: string;
  howItWorksSteps?: Array<{ title?: string; description?: string }>;
  comparisonTitle?: string;
  comparisonDescription?: string;
  comparisonPros?: string[];
  comparisonCons?: string[];
  testimonialsTitle?: string;
  testimonials?: Array<{ quote?: string; name?: string; role?: string }>;
}

const DEFAULT_IMAGE = "/assets/MrProps_main_screen_1768972680323.png";
const DEFAULT_GUIDE_IMAGE = "/assets/generated_images/minimalist_finance_graph.png";
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
  statsBar, howItWorksTitle, howItWorksSteps, comparisonTitle, comparisonDescription,
  comparisonPros, comparisonCons, testimonialsTitle, testimonials,
  badge, description, trustItems, previewTitle, previewMeta, previewBody,
  gateTitle, gateDescription, formPlaceholder, formButtonLabel, formDisclaimer,
  whatIsTitle, whatIsText, useCasesTitle, useCases, customizeTitle, customizeText,
  resourcesTitle, resources,
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

  if (slug.startsWith("guides/")) {
    const guideImages: Record<string, string> = {
      "guides/how-to-start-short-term-rental": "/assets/generated_images/minimalist_automation_gear.png",
      "guides/what-is-airbnb": "/assets/generated_images/minimalist_house_blueprint.png",
      "guides/post-featured": "/assets/generated_images/minimalist_automation_gear.png",
      "guides/airbnb-hosting-guide": "/assets/stock_images/laptop_showing_listi_245cd225.jpg",
      "guides/property-maintenance-guide": "/assets/stock_images/laptop_showing_listi_245cd225.jpg",
    };
    return guideImages[slug] || DEFAULT_GUIDE_IMAGE;
  }

  if (slug.startsWith("compare/")) return DEFAULT_COMPARISON_IMAGE;
  if (slug.startsWith("alternatives/")) return DEFAULT_IMAGE;
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
    // Template-specific fields (leadGenTemplatePage)
    badge: doc.badge,
    description: doc.description,
    trustItems: doc.trustItems,
    previewTitle: doc.previewTitle,
    previewMeta: doc.previewMeta,
    previewBody: doc.previewBody,
    gateTitle: doc.gateTitle,
    gateDescription: doc.gateDescription,
    formPlaceholder: doc.formPlaceholder,
    formButtonLabel: doc.formButtonLabel,
    formDisclaimer: doc.formDisclaimer,
    whatIsTitle: doc.whatIsTitle,
    whatIsText: doc.whatIsText,
    useCasesTitle: doc.useCasesTitle,
    useCases: doc.useCases,
    customizeTitle: doc.customizeTitle,
    customizeText: doc.customizeText,
    resourcesTitle: doc.resourcesTitle,
    resources: (doc.resources || []).map((r) => ({ href: r.href || "#", label: r.label || "Resource", meta: r.meta })),
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
    statsBar: (doc.statsBar || []).filter((s) => s?.value && s?.label).map((s) => ({ value: s.value!, label: s.label! })),
    howItWorksTitle: doc.howItWorksTitle,
    howItWorksSteps: (doc.howItWorksSteps || []).filter((s) => s?.title).map((s) => ({ title: s.title!, description: s.description || "" })),
    comparisonTitle: doc.comparisonTitle,
    comparisonDescription: doc.comparisonDescription,
    comparisonPros: (doc.comparisonPros || []).filter(Boolean) as string[],
    comparisonCons: (doc.comparisonCons || []).filter(Boolean) as string[],
    testimonialsTitle: doc.testimonialsTitle,
    testimonials: (doc.testimonials || []).filter((t) => t?.quote).map((t) => ({ quote: t.quote!, name: t.name || "", role: t.role || "" })),
    faqTitle: doc.faqTitle,
    faqDescription: doc.faqDescription,
    faqs: normalizeFaqs(doc.faqs),
    ctaTitle: doc.ctaTitle,
    ctaText: doc.ctaText,
    ctaPrimaryButton: normalizeButtons(doc.ctaPrimaryButton),
    ctaSecondaryButton: normalizeButtons(doc.ctaSecondaryButton),
  };
}

const fallbackGuides: Array<DirectoryEntry & { date: string; readTime: string; authorName: string; category: string }> = [
  {
    id: "guide-how-to-start-short-term-rental",
    slug: "how-to-start-short-term-rental",
    title: "How to Start a Short-Term Rental Empire in 2026",
    excerpt: "The complete blueprint for launching your first arbitrage unit, mastering dynamic pricing, and automating operations.",
    body: defaultBody("The complete blueprint for launching your first arbitrage unit, mastering dynamic pricing, and automating operations."),
    seoTitle: "How to Start a Short-Term Rental Empire in 2026 | Mr. Props",
    seoDescription: "The complete blueprint for launching your first arbitrage unit, mastering dynamic pricing, and automating operations.",
    image: fallbackImageForSlug("guides/how-to-start-short-term-rental"),
    updated: FALLBACK_DATE,
    publishedAt: "2025-10-24",
    updatedAt: "2025-10-24",
    category: "Operations",
    authorName: "Mr. Props Team",
    date: "Oct 24, 2025",
    readTime: "1 min read",
  },
  {
    id: "guide-what-is-airbnb",
    slug: "what-is-airbnb",
    title: "What Is Airbnb? A Host's Perspective",
    excerpt: "Understanding fees, algorithms, and how the platform really works for modern hosts.",
    body: defaultBody("Understanding fees, algorithms, and how the platform really works for modern hosts."),
    seoTitle: "What Is Airbnb? A Host's Perspective | Mr. Props",
    seoDescription: "Understanding fees, algorithms, and how the platform really works for modern hosts.",
    image: fallbackImageForSlug("guides/what-is-airbnb"),
    updated: FALLBACK_DATE,
    publishedAt: "2025-10-23",
    updatedAt: "2025-10-23",
    category: "Marketing",
    authorName: "Mr. Props Team",
    date: "Oct 23, 2025",
    readTime: "1 min read",
  },
  {
    id: "guide-post-featured",
    slug: "post-featured",
    title: "The Blueprint: Scaling from 1 to 10 Units in 12 Months",
    excerpt: "A step-by-step guide to leveraging rental arbitrage, co-hosting, and automation to build a six-figure portfolio without owning property.",
    body: defaultBody("A step-by-step guide to leveraging rental arbitrage, co-hosting, and automation to build a six-figure portfolio without owning property."),
    seoTitle: "The Blueprint: Scaling from 1 to 10 Units in 12 Months | Mr. Props",
    seoDescription: "A step-by-step guide to leveraging rental arbitrage, co-hosting, and automation to build a six-figure portfolio without owning property.",
    image: fallbackImageForSlug("guides/post-featured"),
    updated: FALLBACK_DATE,
    publishedAt: "2025-10-22",
    updatedAt: "2025-10-22",
    category: "Operations",
    authorName: "Mr. Props Team",
    date: "Oct 22, 2025",
    readTime: "1 min read",
  },
  {
    id: "guide-airbnb-hosting-guide",
    slug: "airbnb-hosting-guide",
    title: "Mastering Airbnb Hosting",
    excerpt: "From your first listing to Superhost status, here is everything you need to know about building a profitable short-term rental business.",
    body: defaultBody("From your first listing to Superhost status, here is everything you need to know about building a profitable short-term rental business."),
    seoTitle: "Mastering Airbnb Hosting: The Ultimate Guide | Mr. Props",
    seoDescription: "From your first listing to Superhost status, here is everything you need to know about building a profitable short-term rental business.",
    image: fallbackImageForSlug("guides/airbnb-hosting-guide"),
    updated: "Nov 15, 2025",
    publishedAt: "2025-11-15",
    updatedAt: "2025-11-15",
    category: "Operations",
    authorName: "Mr. Props Team",
    date: "Nov 15, 2025",
    readTime: "15 min read",
  },
  {
    id: "guide-property-maintenance-guide",
    slug: "property-maintenance-guide",
    title: "The Complete Guide to Property Maintenance",
    excerpt: "Keep your properties in pristine condition with automated tracking, scheduled upkeep, and contractor management.",
    body: defaultBody("Keep your properties in pristine condition with automated tracking, scheduled upkeep, and contractor management."),
    seoTitle: "Property Maintenance Guide for Hosts | Mr. Props",
    seoDescription: "Keep your properties in pristine condition with automated tracking, scheduled upkeep, and contractor management.",
    image: fallbackImageForSlug("guides/property-maintenance-guide"),
    updated: "Dec 10, 2025",
    publishedAt: "2025-12-10",
    updatedAt: "2025-12-10",
    category: "Operations",
    authorName: "Mr. Props Team",
    date: "Dec 10, 2025",
    readTime: "10 min read",
  },
];

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

export const fetchLandingPages = cache(async (pageType: "features" | "services") => {
  // All landing page content from Supabase — fallbacks for pages not yet generated
  return landingFallbacks.filter((item) => item.pageType === pageType);
});

export const fetchLandingPageBySlug = cache(async (pageType: "features" | "services", slug: string) => {
  const supabaseResult = await fetchLandingFromSupabase(pageType, slug);
  if (supabaseResult) return supabaseResult;
  return landingFallbacks.find((item) => item.pageType === pageType && item.slug === slug) || null;
});

export const fetchComparisons = cache(async () => {
  const sbEntries = await fetchSupabaseListings("compare");
  return dedupeBySlug(sbEntries);
});

export const fetchAlternatives = cache(async () => {
  const sbEntries = await fetchSupabaseListings("alternatives");
  return dedupeBySlug(sbEntries);
});

export const fetchRegulations = cache(async () => {
  const sbEntries = await fetchSupabaseListings("regulations");
  return dedupeBySlug(sbEntries);
});

export const fetchTaxes = cache(async () => {
  const sbEntries = await fetchSupabaseListings("taxes");
  return dedupeBySlug(sbEntries);
});

export const fetchTemplates = cache(async () => {
  const sbEntries = await fetchSupabaseListings("templates");
  return dedupeBySlug([...sbEntries, ...templateFallbacks]);
});

export const fetchTools = cache(async () => {
  const sbEntries = await fetchSupabaseListings("tools");
  return dedupeBySlug([...sbEntries, ...toolFallbacks]);
});

export const fetchGuides = cache(async () => {
  const sbEntries = await fetchSupabaseListings("guides");
  const sbGuides = sbEntries.map((entry) => ({
    ...entry,
    authorName: "Mr. Props Team",
    category: "Operations",
    date: formatDisplayDate(entry.publishedAt),
    readTime: calculateReadTime(entry.excerpt || ''),
  }));
  return dedupeBySlug([...sbGuides, ...fallbackGuides]);
});

export const fetchGuideBySlug = cache(async (slug: string) => {
  const supabaseResult = await fetchDirectoryEntryFromSupabase('guides', slug);
  if (supabaseResult) {
    const sd = supabaseResult as any;
    return {
      ...supabaseResult,
      authorName: sd.authorName || "Mr. Props Team",
      category: sd.category || "Operations",
      date: formatDisplayDate(supabaseResult.publishedAt),
      readTime: calculateReadTime(supabaseResult.bodyHtml?.replace(/<[^>]+>/g, ' ') || supabaseResult.excerpt),
    };
  }
  const cleanSlug = stripPrefix(slug, "guides");
  return fallbackGuides.find((guide) => guide.slug === cleanSlug) || null;
});

export function splitNestedSlug(fullSlug: string, prefix: string, expectedDepth: number) {
  const clean = stripPrefix(fullSlug, prefix);
  const parts = clean.split("/").filter(Boolean);
  return parts.slice(0, expectedDepth);
}
