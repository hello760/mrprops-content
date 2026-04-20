// Sanity removed — all content served from Supabase
import type { PortableTextBlock } from "@/lib/content-helpers";
import type { CalculatorUiCopy } from "@/components/tools/calculatorCopy";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase dual-source (Phase 4E) ─────────────────────────────────────────
let _sbClient: any = null;
function getSBSync() {
  if (_sbClient) return _sbClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _sbClient = createClient(url, key);
  return _sbClient;
}

// Phase 5: shared normalizer used by both slug-based (production) and id-based (draft) fetchers.
function normalizeTemplateRow(data: any, category: string, slug: string): TemplatePageContent {
  const sd = (data.structured_data || {}) as Record<string, any>;
  const fallback = getTemplateFallback(category, slug) || templateFallbacks[0];
  return {
    ...fallback,
    id: data.id,
    category: category,
    slug: slug,
    title: sd.hero?.previewTitle || data.title || fallback.title,
    badge: sd.hero?.badge || fallback.badge,
    description: sd.gate?.description || fallback.description,
    trustItems: sd.trustItems || fallback.trustItems,
    previewTitle: sd.hero?.previewTitle || fallback.previewTitle,
    previewMeta: sd.hero?.previewMeta || fallback.previewMeta,
    previewBody: [],
    gateTitle: sd.gate?.title || fallback.gateTitle,
    gateDescription: sd.gate?.description || fallback.gateDescription,
    formPlaceholder: sd.gate?.formPlaceholder || fallback.formPlaceholder,
    formButtonLabel: sd.gate?.buttonLabel || fallback.formButtonLabel,
    formDisclaimer: sd.gate?.disclaimer || fallback.formDisclaimer,
    whatIsTitle: sd.whatIsTitle || fallback.whatIsTitle,
    whatIsText: sd.whatIsText || fallback.whatIsText,
    useCasesTitle: sd.useCasesTitle || fallback.useCasesTitle,
    useCases: sd.useCases || fallback.useCases,
    customizeTitle: sd.customizeTitle || fallback.customizeTitle,
    customizeText: sd.customizeText || fallback.customizeText,
    faqTitle: 'Frequently Asked Questions',
    faqs: sd.faqs || fallback.faqs,
    resourcesTitle: sd.resourcesTitle || fallback.resourcesTitle,
    resources: (sd.resources || fallback.resources || []).filter((r: any) => r && r.href),
    seoTitle: sd.seoTitle || data.seo_title || fallback.seoTitle,
    seoDescription: sd.seoDescription || data.meta_description || fallback.seoDescription,
    body: [],
    bodyHtml: ((data.structured_data as any)?.bodyHtml || data.content_body) || undefined,
    // FIX-010 + FIX-T1: new structured fields. All optional; UI tolerates absence.
    bestPractices: Array.isArray(sd.bestPractices) ? sd.bestPractices : undefined,
    commonMistakes: (sd.commonMistakes && Array.isArray(sd.commonMistakes.dontList) && Array.isArray(sd.commonMistakes.doList))
      ? { dontList: sd.commonMistakes.dontList, doList: sd.commonMistakes.doList }
      : undefined,
    briefClosing: (sd.briefClosing && typeof sd.briefClosing.title === 'string' && typeof sd.briefClosing.body === 'string')
      ? { title: sd.briefClosing.title, body: sd.briefClosing.body }
      : undefined,
    templateFile: sd.templateFile && typeof sd.templateFile === 'object'
      ? { url: sd.templateFile.url || null, format: sd.templateFile.format ?? null, fileName: sd.templateFile.fileName ?? null }
      : undefined,
  };
}

function normalizeToolRow(data: any, category: string, slug: string): ToolPageContent {
  const sd = (data.structured_data || {}) as Record<string, any>;
  const fallback = resolveToolFallback(category, slug);
  return {
    id: data.id,
    category: category,
    slug: slug,
    title: sd.mainTitle || data.title || fallback?.title || '',
    description: sd.introText || fallback?.description || '',
    seoTitle: sd.seoTitle || data.seo_title || fallback?.seoTitle || '',
    seoDescription: sd.seoDescription || data.meta_description || fallback?.seoDescription || '',
    mainTitle: sd.mainTitle || data.title || '',
    introText: sd.introText || '',
    benefits: sd.benefits || fallback?.benefits || [],
    faqs: sd.faqs || fallback?.faqs || [],
    body: [],
    bodyHtml: ((data.structured_data as any)?.bodyHtml || data.content_body) || undefined,
    calculatorUi: sd.calculatorUi || fallback?.calculatorUi || (sd.calculatorType ? { type: sd.calculatorType } as any : undefined),
    howItWorks: sd.howItWorks || undefined,
    cta: sd.cta || undefined,
  };
}

// Phase 5 C-1: by-id fetch for draft preview. Skips writing_status='published' filter
// so drafts can preview. Uses the same normalizer + fallback chain as production so
// output is byte-identical to /tools/[category]/[slug] and /templates/[category]/[slug].
export async function fetchTemplatePageById(id: string): Promise<TemplatePageContent | null> {
  const sb = getSBSync();
  if (!sb || !process.env.MR_PROPS_CLIENT_ID) return null;
  const { data, error } = await sb
    .from('content_pieces')
    .select('id, custom_slug, title, type_of_work, content_body, structured_data, seo_title, meta_description, published_at, client_id, live_url')
    .eq('id', id)
    .single();
  if (error || !data || (data as any).client_id !== process.env.MR_PROPS_CLIENT_ID) return null;
  // Derive category + slug from live_url path (prefers live_url over custom_slug since
  // aligned slugs use live_url-matching paths, but fall back to custom_slug).
  const row: any = data;
  let category = 'general', slug = '';
  const fromLive = row.live_url ? new URL(row.live_url).pathname : '';
  const fromSlug = (row.custom_slug || '').split('/');
  const src = fromLive.startsWith('/templates/') ? fromLive.split('/').filter(Boolean) : fromSlug;
  if (src.length >= 3 && src[0] === 'templates') { category = src[1]; slug = src.slice(2).join('/'); }
  else if (src.length === 2 && src[0] === 'templates') { slug = src[1]; }
  else { slug = row.custom_slug || ''; }
  return normalizeTemplateRow(row, category, slug);
}

export async function fetchToolPageById(id: string): Promise<ToolPageContent | null> {
  const sb = getSBSync();
  if (!sb || !process.env.MR_PROPS_CLIENT_ID) return null;
  const { data, error } = await sb
    .from('content_pieces')
    .select('id, custom_slug, title, type_of_work, content_body, structured_data, seo_title, meta_description, published_at, client_id, live_url')
    .eq('id', id)
    .single();
  if (error || !data || (data as any).client_id !== process.env.MR_PROPS_CLIENT_ID) return null;
  const row: any = data;
  let category = 'general', slug = '';
  const fromLive = row.live_url ? new URL(row.live_url).pathname : '';
  const fromSlug = (row.custom_slug || '').split('/');
  const src = fromLive.startsWith('/tools/') ? fromLive.split('/').filter(Boolean) : fromSlug;
  if (src.length >= 3 && src[0] === 'tools') { category = src[1]; slug = src.slice(2).join('/'); }
  else if (src.length === 2 && src[0] === 'tools') { slug = src[1]; }
  else { slug = row.custom_slug || ''; }
  return normalizeToolRow(row, category, slug);
}

async function fetchTemplateFromSupabase(category: string, slug: string): Promise<TemplatePageContent | null> {
  const sb = getSBSync();
  if (!sb || !process.env.MR_PROPS_CLIENT_ID) return null;

  const slugVariants = [`templates/${category}/${slug}`, `templates/${slug}`, slug];
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
  const fallback = getTemplateFallback(category, slug) || templateFallbacks[0];

  return {
    ...fallback,
    id: data.id,
    category: category,
    slug: slug,
    title: sd.hero?.previewTitle || data.title || fallback.title,
    badge: sd.hero?.badge || fallback.badge,
    description: sd.gate?.description || fallback.description,
    trustItems: sd.trustItems || fallback.trustItems,
    previewTitle: sd.hero?.previewTitle || fallback.previewTitle,
    previewMeta: sd.hero?.previewMeta || fallback.previewMeta,
    previewBody: [],
    gateTitle: sd.gate?.title || fallback.gateTitle,
    gateDescription: sd.gate?.description || fallback.gateDescription,
    formPlaceholder: sd.gate?.formPlaceholder || fallback.formPlaceholder,
    formButtonLabel: sd.gate?.buttonLabel || fallback.formButtonLabel,
    formDisclaimer: sd.gate?.disclaimer || fallback.formDisclaimer,
    whatIsTitle: sd.whatIsTitle || fallback.whatIsTitle,
    whatIsText: sd.whatIsText || fallback.whatIsText,
    useCasesTitle: sd.useCasesTitle || fallback.useCasesTitle,
    useCases: sd.useCases || fallback.useCases,
    customizeTitle: sd.customizeTitle || fallback.customizeTitle,
    customizeText: sd.customizeText || fallback.customizeText,
    faqTitle: 'Frequently Asked Questions',
    faqs: sd.faqs || fallback.faqs,
    resourcesTitle: sd.resourcesTitle || fallback.resourcesTitle,
    resources: (sd.resources || fallback.resources || []).filter((r: any) => r && r.href),
    seoTitle: sd.seoTitle || data.seo_title || fallback.seoTitle,
    seoDescription: sd.seoDescription || data.meta_description || fallback.seoDescription,
    body: [],
    bodyHtml: ((data.structured_data as any)?.bodyHtml || data.content_body) || undefined,
  };
}

async function fetchToolFromSupabase(category: string, slug: string): Promise<ToolPageContent | null> {
  // Use local getSB() — don't import from supabase.ts (dynamic imports can fail in page components)
  const sb = getSBSync();
  if (!sb || !process.env.MR_PROPS_CLIENT_ID) return null;

  const slugVariants = [`tools/${category}/${slug}`, `tools/${slug}`, slug];
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
  const fallback = resolveToolFallback(category, slug);

  return {
    id: data.id,
    category: category,
    slug: slug,
    title: sd.mainTitle || data.title || fallback?.title || '',
    description: sd.introText || fallback?.description || '',
    seoTitle: sd.seoTitle || data.seo_title || fallback?.seoTitle || '',
    seoDescription: sd.seoDescription || data.meta_description || fallback?.seoDescription || '',
    mainTitle: sd.mainTitle || data.title || '',
    introText: sd.introText || '',
    benefits: sd.benefits || fallback?.benefits || [],
    faqs: sd.faqs || fallback?.faqs || [],
    body: [],
    bodyHtml: ((data.structured_data as any)?.bodyHtml || data.content_body) || undefined,
    calculatorUi: sd.calculatorUi || fallback?.calculatorUi || (sd.calculatorType ? { type: sd.calculatorType } as any : undefined),
    howItWorks: sd.howItWorks || undefined,
    cta: sd.cta || undefined,
  };
}

export interface LinkItem {
  label: string;
  href: string;
  meta?: string;
}

export interface TemplatePageContent {
  id: string;
  category: string;
  slug: string;
  title: string;
  badge: string;
  description: string;
  trustItems: string[];
  previewTitle: string;
  previewMeta: string;
  previewBody: PortableTextBlock[];
  gateTitle: string;
  gateDescription: string;
  formPlaceholder: string;
  formButtonLabel: string;
  formDisclaimer: string;
  whatIsTitle: string;
  whatIsText: string;
  useCasesTitle: string;
  useCases: string[];
  customizeTitle: string;
  customizeText: string;
  faqTitle: string;
  faqs: Array<{ question: string; answer: string }>;
  resourcesTitle: string;
  resources: LinkItem[];
  seoTitle: string;
  seoDescription: string;
  body?: PortableTextBlock[];
  bodyHtml?: string;
  // FIX-010 (PF-10): PDF template §6-9 structured fields.
  bestPractices?: string[];
  commonMistakes?: { dontList: string[]; doList: string[] };
  briefClosing?: { title: string; body: string };
  // FIX-T1 (PF-T1): real-file delivery via gate. url may be null while content team is
  // still producing the file; UI falls back to the current email-only gate in that case.
  templateFile?: { url: string | null; format?: 'pdf' | 'docx' | 'notion' | 'xlsx' | null; fileName?: string | null };
}

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
  bodyHtml?: string;
  calculatorUi?: CalculatorUiCopy;
  howItWorks?: Array<{ fieldName: string; measures: string; whyItMatters: string }>;
  cta?: { headline: string; sentence: string; primaryButton: { label: string; href: string }; secondaryButton: { label: string; href: string }; trustMicrocopy: string };
}

// Sanity interfaces removed — all content from Supabase

const block = (text: string): PortableTextBlock => ({
  _key: text.slice(0, 24).replace(/\s+/g, "-").toLowerCase(),
  _type: "block",
  style: "normal",
  children: [{ _type: "span", text }],
});

const templateSeeds = [
  ["guest-experience", "airbnb-welcome-book", "Airbnb Welcome Book", ["Downloaded 542 times this week", "By Alex, Superhost", "PDF, Word, Notion"]],
  ["legal", "house-rules-template", "House Rules Template", ["Downloaded 542 times this week", "By Alex, Superhost", "PDF, Notion"]],
  ["operations", "cleaning-checklist", "Cleaning Checklist", ["Downloaded 542 times this week", "By Alex, Superhost", "Excel, PDF"]],
  ["operations", "inventory-tracker", "Inventory Tracker", ["Downloaded 542 times this week", "By Alex, Superhost", "Excel, Sheets"]],
  ["guest-experience", "guest-message-scripts", "Guest Message Scripts", ["Downloaded 542 times this week", "By Alex, Superhost", "Notion, PDF"]],
  ["legal", "rental-agreement", "Short-Term Rental Agreement", ["Downloaded 542 times this week", "By Alex, Superhost", "Word, PDF"]],
  ["marketing", "listing-optimization-guide", "Listing Optimization Guide", ["Downloaded 542 times this week", "By Alex, Superhost", "PDF"]],
  ["legal", "co-host-contract", "Co-Hosting Contract", ["Downloaded 542 times this week", "By Alex, Superhost", "Word"]],
  ["operations", "pricing-strategy-calculator", "Pricing Strategy Calculator", ["Downloaded 542 times this week", "By Alex, Superhost", "Excel"]],
  ["guest-experience", "amenities-checklist", "Essential Amenities List", ["Downloaded 542 times this week", "By Alex, Superhost", "PDF"]],
] as const;

const createField = (key: string, label: string, helpText?: string) => ({ key, label, ...(helpText ? { helpText } : {}) });
const createResult = (key: string, label: string, helpText?: string) => ({ key, label, ...(helpText ? { helpText } : {}) });

export const templateFallbacks: TemplatePageContent[] = templateSeeds.map(([category, slug, title, trustItems]) => ({
  id: `template-${slug}`,
  category,
  slug,
  title,
  badge: `Free ${category.replace(/-/g, " ")} Template`,
  description: `Stop starting from scratch. Join 5,000+ hosts using this battle-tested ${title.toLowerCase()} to save time and impress guests.`,
  trustItems: [...trustItems],
  previewTitle: title,
  previewMeta: "Version 2.4 • Updated Oct 2025",
  previewBody: [
    block("Welcome to your home away from home! We are thrilled to have you stay with us. This guide contains everything you need to know to make your stay comfortable and enjoyable."),
    block("1. Arrival & Check-in — Check-in time is after 3:00 PM. If you need to drop off luggage earlier, please let us know at least 24 hours in advance."),
    block("2. WiFi & Connectivity — Network Name: The_Hideaway_Guest. Password: Welcome2025!"),
    block("3. House Rules — No smoking inside the property. Quiet hours are from 10:00 PM to 7:00 AM. Please remove shoes upon entry."),
  ],
  gateTitle: "Unlock the full template",
  gateDescription: "Join 5,000+ hosts using this template to streamline their operations.",
  formPlaceholder: "Enter your email address",
  formButtonLabel: "Send me the Template",
  formDisclaimer: "No spam. Unsubscribe anytime.",
  whatIsTitle: "What is this template?",
  whatIsText: `This ${title.toLowerCase()} is designed to help short-term rental hosts provide a professional experience without the headache of creating documents from scratch. Based on industry best practices and feedback from Superhosts.`,
  useCasesTitle: "When to use it?",
  useCases: ["New listing launches", "Standardizing multi-unit operations", "Improving guest review scores", "Reducing repeat questions"],
  customizeTitle: "How to customize it?",
  customizeText: "The template comes in multiple formats (Word, PDF, Notion). We've highlighted the sections you need to change in [brackets], such as property name, wifi passwords, and local emergency contacts.",
  faqTitle: "Frequently Asked Questions",
  faqs: [
    { question: "Is this template legally binding?", answer: "While drafted by professionals, this is a general template. We recommend having a local attorney review it to ensure compliance with your specific local regulations." },
    { question: "Can I share this with my co-host?", answer: "Yes! Once you download it, the file is yours to keep, edit, and share with your team." },
    { question: "Do you have a Notion version?", answer: "Yes, the download link includes a direct link to duplicate the Notion template to your workspace." },
  ],
  resourcesTitle: "More Free Resources",
  resources: [
    { label: "Cleaning Checklist", href: "/templates/operations/cleaning-checklist", meta: "Download" },
    { label: "Inventory Tracker", href: "/templates/operations/inventory-tracker", meta: "Download" },
    { label: "Profit Calculator", href: "/tools/booking/airbnb-profit-calculator", meta: "Calculate" },
  ],
  seoTitle: `${title} | Mr. Props`,
  seoDescription: `Download the ${title.toLowerCase()} and customize it for your short-term rental operation.`,
}));

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
      fields: [createField("adr", "Average Daily Rate (ADR)"), createField("occupancy", "Occupancy Rate"), createField("rent", "Monthly Rent / Mortgage ($)"), createField("cleaning", "Cleaning Fee per Stay ($)"), createField("management", "Management Fee (%)")],
      results: [createResult("monthlyProfit", "Estimated Monthly Profit"), createResult("annualProfit", "Annual Profit"), createResult("profitMargin", "Profit Margin")],
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
    category: "booking",
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
      fields: [createField("cleanerRate", "Cleaner hourly rate ($)"), createField("supplies", "Supplies & linen per turn ($)"), createField("hours", "Cleaning hours"), createField("buffer", "Operator buffer", "Use a small buffer to cover coordination, consumables, and surprise resets.")],
      results: [createResult("recommendedFee", "Recommended Guest Cleaning Fee"), createResult("baseTurnCost", "Base Turn Cost"), createResult("bufferAdded", "Buffer Added")],
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
    id: "tool-renovation-roi-calculator",
    category: "booking",
    slug: "renovation-roi-calculator",
    title: "Renovation ROI Calculator",
    description: "Should you upgrade that kitchen? Find out if the investment pays off.",
    seoTitle: "Renovation ROI Calculator for Airbnb | Mr. Props",
    seoDescription: "Calculate the return on investment for property renovations.",
    mainTitle: "Invest smart, not hard",
    introText: "Not all renovations are created equal. Adding a hot tub might cost $5,000 but could increase your nightly rate by $30, paying for itself in less than a year. Use this tool to weigh the costs versus potential gains.",
    benefits: [
      { title: "Hot Tubs & Pools", description: "Highest ROI upgrades in most markets." },
      { title: "Interior Design", description: "Professional staging can increase booking conversion by 40%." },
      { title: "Kitchen Upgrades", description: "Essential for capturing longer-term stays." },
    ],
    faqs: [
      { question: "What occupancy assumption is used?", answer: "The calculator uses a conservative 65% occupancy assumption for break-even modelling." },
      { question: "Should I include financing costs?", answer: "Yes, if you are borrowing for the renovation, include financing in your total project cost." },
    ],
    calculatorUi: {
      fields: [createField("cost", "Total Renovation Cost ($)", "Include materials and labor."), createField("rateIncrease", "Expected Nightly Rate Increase", "How much more can you charge per night?")],
      results: [createResult("monthsToBreakEven", "Months to Break Even"), createResult("roiFirstYear", "1-Year ROI"), createResult("annualRevenueIncrease", "Annual Revenue Increase")],
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
    id: "tool-kitchen-cost-calculator",
    category: "renovations",
    slug: "kitchen-cost-calculator",
    title: "Kitchen Cost Calculator",
    description: "Full gut renovation estimates including cabinets, countertops, and appliances.",
    seoTitle: "Kitchen Renovation Cost Calculator | Mr. Props",
    seoDescription: "Estimate the cost of a full kitchen remodel for your rental property.",
    mainTitle: "Kitchens sell rentals",
    introText: "The kitchen is often the deciding factor for guests. Use this calculator to budget for a renovation that pays for itself in higher nightly rates.",
    benefits: [
      { title: "Cabinetry", description: "The biggest cost, but also the biggest visual impact." },
      { title: "Appliances", description: "Stainless steel is the standard for modern rentals." },
      { title: "Labor", description: "Don't forget to budget for demolition and installation." },
    ],
    faqs: [
      { question: "Does this include layout changes?", answer: "No. Structural work, plumbing moves, and layout reconfiguration should be added separately." },
      { question: "Which tier should I choose?", answer: "Mid-tier is typically right for most urban STRs. Luxury only makes sense where ADR supports it." },
    ],
    calculatorUi: {
      fields: [createField("kitchenSize", "Kitchen Size (sq ft)"), createField("applianceTier", "Appliance Tier")],
      results: [createResult("estimatedCost", "Estimated Cost", "Includes cabinetry, countertops, labor, and {applianceTier} appliances.")],
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
    id: "tool-bedroom-reno-calculator",
    category: "renovations",
    slug: "bedroom-reno-calculator",
    title: "Bedroom Renovation Estimator",
    description: "Calculate flooring, paint, and furnishing costs based on square footage.",
    seoTitle: "Bedroom Renovation Cost Calculator | Mr. Props",
    seoDescription: "Estimate the cost of upgrading bedrooms for your short-term rental.",
    mainTitle: "Comfort equals reviews",
    introText: "Guests spend 8 hours a night in the bedroom. Investing in quality mattresses, blackout curtains, and noise reduction pays off in 5-star sleep reviews.",
    benefits: [
      { title: "Flooring", description: "Hardwood or luxury vinyl plank is durable and easy to clean." },
      { title: "Paint", description: "A fresh coat of paint is the highest ROI upgrade you can make." },
      { title: "Furnishings", description: "Don't skimp on the mattress. It's the most important item." },
    ],
    faqs: [
      { question: "Does this include ensuite bathrooms?", answer: "No. This estimate is for the bedroom only, not bathrooms or closet builds." },
      { question: "What finish level is typical for STRs?", answer: "Standard to premium usually performs best: durable, clean, and visually elevated without overbuilding." },
    ],
    calculatorUi: {
      fields: [createField("roomSize", "Room Size (sq ft)"), createField("materialQuality", "Finish Quality", "Economy to Luxury")],
      results: [createResult("estimatedCost", "Estimated Cost", "Includes flooring, paint, furnishings, and labor based on national averages.")],
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
    id: "tool-rental-yield-calculator",
    category: "finance",
    slug: "rental-yield-calculator",
    title: "Rental Yield Calculator",
    description: "Calculate gross and net rental yields for your investment property.",
    seoTitle: "Rental Yield Calculator 2026 | Mr. Props",
    seoDescription: "Free rental yield calculator. Instantly compute gross and net yield to compare short-term rental investments.",
    mainTitle: "Know your real rental yield",
    introText: "Rental yield is the single most important number when comparing investment properties. This calculator shows both gross and net yield so you can make apples-to-apples comparisons across markets, property types, and price points.",
    benefits: [
      { title: "Gross vs Net Clarity", description: "See the headline yield and the after-expense reality side by side." },
      { title: "Quick Comparisons", description: "Run multiple properties in minutes to find the strongest performer." },
      { title: "Investor-Grade Output", description: "Use the same yield metrics that institutional buyers rely on." },
    ],
    faqs: [
      { question: "What is a good rental yield?", answer: "For short-term rentals, a gross yield above 8% is strong. Net yields above 5% after all operating costs are considered excellent." },
      { question: "What's the difference between gross and net yield?", answer: "Gross yield uses total income divided by property value. Net yield subtracts all operating expenses first, giving a more realistic picture of return." },
      { question: "Should I use purchase price or current value?", answer: "Use current market value for ongoing portfolio analysis. Use purchase price when evaluating the original investment decision." },
    ],
    calculatorUi: {
      fields: [
        createField("propertyValue", "Property Value ($)"),
        createField("monthlyRent", "Monthly Rental Income ($)"),
        createField("annualExpenses", "Annual Expenses ($)", "Insurance, maintenance, management, taxes, etc."),
      ],
      results: [
        createResult("grossYield", "Gross Yield"),
        createResult("netYield", "Net Yield"),
        createResult("annualIncome", "Annual Rental Income"),
      ],
    },
  },
];

// Sanity GROQ queries removed

export async function fetchTemplatePage(category: string, slug: string) {
  // Inline Supabase query (same pattern as working fetchToolPage)
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const clientId = process.env.MR_PROPS_CLIENT_ID;

    if (url && key && clientId) {
      const sb = createClient(url, key);
      const slugVariants = [`templates/${category}/${slug}`, `templates/${slug}`, slug];

      const { data, error } = await sb
        .from('content_pieces')
        .select('id, custom_slug, title, type_of_work, content_body, structured_data, seo_title, meta_description, published_at')
        .eq('client_id', clientId)
        .eq('writing_status', 'published')
        .not('structured_data', 'is', null)
        .in('custom_slug', slugVariants)
        .single();

      if (!error && data?.structured_data) {
        const sd = data.structured_data as Record<string, any>;
        const fallback = getTemplateFallback(category, slug) || templateFallbacks[0];
        return {
          ...fallback,
          id: data.id,
          category: category,
          slug: slug,
          title: sd.hero?.previewTitle || data.title || fallback.title,
          badge: sd.hero?.badge || fallback.badge,
          description: sd.gate?.description || fallback.description,
          trustItems: sd.trustItems || fallback.trustItems,
          previewTitle: sd.hero?.previewTitle || fallback.previewTitle,
          previewMeta: sd.hero?.previewMeta || fallback.previewMeta,
          previewBody: [],
          gateTitle: sd.gate?.title || fallback.gateTitle,
          gateDescription: sd.gate?.description || fallback.gateDescription,
          formPlaceholder: sd.gate?.formPlaceholder || fallback.formPlaceholder,
          formButtonLabel: sd.gate?.buttonLabel || fallback.formButtonLabel,
          formDisclaimer: sd.gate?.disclaimer || fallback.formDisclaimer,
          whatIsTitle: sd.whatIsTitle || fallback.whatIsTitle,
          whatIsText: sd.whatIsText || fallback.whatIsText,
          useCasesTitle: sd.useCasesTitle || fallback.useCasesTitle,
          useCases: sd.useCases || fallback.useCases,
          customizeTitle: sd.customizeTitle || fallback.customizeTitle,
          customizeText: sd.customizeText || fallback.customizeText,
          faqTitle: 'Frequently Asked Questions',
          faqs: sd.faqs || fallback.faqs,
          resourcesTitle: sd.resourcesTitle || fallback.resourcesTitle,
          resources: (sd.resources || fallback.resources || []).filter((r: any) => r && r.href),
          seoTitle: sd.seoTitle || data.seo_title || fallback.seoTitle,
          seoDescription: sd.seoDescription || data.meta_description || fallback.seoDescription,
          body: [],
          bodyHtml: ((data.structured_data as any)?.bodyHtml || data.content_body) || undefined,
        } as TemplatePageContent;
      }
    }
  } catch (sbErr) {
    console.error('[fetchTemplatePage] Supabase error:', sbErr);
  }

  // No Supabase match — return hardcoded fallback
  return getTemplateFallback(category, slug);
}

export async function fetchToolPage(category: string, slug: string) {
  // Supabase direct query
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const clientId = process.env.MR_PROPS_CLIENT_ID;

    if (url && key && clientId) {
      const sb = createClient(url, key);
      const slugVariants = [`tools/${category}/${slug}`, `tools/${slug}`, slug];

      const { data, error } = await sb
        .from('content_pieces')
        .select('id, custom_slug, title, type_of_work, content_body, structured_data, seo_title, meta_description, published_at')
        .eq('client_id', clientId)
        .eq('writing_status', 'published')
        .not('structured_data', 'is', null)
        .in('custom_slug', slugVariants)
        .single();

      if (!error && data?.structured_data) {
        const sd = data.structured_data as Record<string, any>;
    const fallback = resolveToolFallback(category, slug);
    return {
      id: data.id,
      category: category,
      slug: slug,
      title: sd.mainTitle || data.title || fallback?.title || '',
      description: sd.introText || fallback?.description || '',
      seoTitle: sd.seoTitle || data.seo_title || fallback?.seoTitle || '',
      seoDescription: sd.seoDescription || data.meta_description || fallback?.seoDescription || '',
      mainTitle: sd.mainTitle || data.title || '',
      introText: sd.introText || '',
      benefits: sd.benefits || fallback?.benefits || [],
      faqs: sd.faqs || fallback?.faqs || [],
      body: [],
      bodyHtml: ((data.structured_data as any)?.bodyHtml || data.content_body) || undefined,
      calculatorUi: sd.calculatorUi || fallback?.calculatorUi || (sd.calculatorType ? { type: sd.calculatorType } as any : undefined),
      howItWorks: sd.howItWorks || undefined,
      cta: sd.cta || undefined,
    } as ToolPageContent;
      }
    }
  } catch (sbErr) {
    console.error('[fetchToolPage] Supabase error:', sbErr);
  }

  // No Supabase match — return hardcoded fallback
  return resolveToolFallback(category, slug);
}

// Sanity normalize functions removed — no longer needed

export function getTemplateFallback(category?: string | null, slug?: string | null) {
  return templateFallbacks.find((item) => item.category === category && item.slug === slug) || null;
}

export function getToolFallback(category?: string | null, slug?: string | null) {
  return toolFallbacks.find((item) => item.category === category && item.slug === slug) || null;
}

/* ── slug / category aliases for backward-compat with old SPA routes ── */
const SLUG_ALIASES: Record<string, { category: string; slug: string }> = {
  "renovation-calculator": { category: "renovations", slug: "renovation-roi-calculator" },
  "airbnb-profit-calculator-v2": { category: "booking", slug: "airbnb-profit-calculator" },
};

/**
 * Resolves a (category, slug) pair through aliases so that old SPA routes
 * still resolve.  The dynamic route should call this instead of
 * getToolFallback directly.
 */
export function resolveToolFallback(category: string, slug: string): ToolPageContent | null {
  const direct = getToolFallback(category, slug);
  if (direct) return direct;
  const alias = SLUG_ALIASES[slug];
  if (alias) return getToolFallback(alias.category, alias.slug);
  return null;
}
