/**
 * Mr Props — GA4 analytics helper library.
 *
 * Implements the Gold Standard CRO event taxonomy for mrprops.io. All events
 * use GA4-conformant `lowercase_snake_case` names and reuse GA4 recommended
 * event names where possible (`generate_lead`, `file_download`, `sign_up`,
 * `select_item`, `scroll`) so the standard GA4 reports auto-populate.
 *
 * Initial implementation: 2026-05-22.
 *
 * Key design decisions:
 *   - Measurement ID comes from `NEXT_PUBLIC_GA_MEASUREMENT_ID` so it is
 *     swappable between dev / staging / prod without code changes. If unset,
 *     every helper becomes a no-op so previews / local dev don't pollute the
 *     property.
 *   - GDPR / EU Consent Mode v2: defaults are wired in
 *     `<GoogleAnalytics />` with `analytics_storage` denied by default for
 *     EU regions. The `<ConsentBanner />` calls `grantAnalyticsConsent()` /
 *     `denyAnalyticsConsent()` to update once the visitor decides.
 *   - All helpers are safe to call from the server: they short-circuit when
 *     `window` is undefined.
 *   - Public surface is the small set of `track*` helpers below. Page-level
 *     instrumentation should NOT call `gtag` directly — it should call a
 *     typed helper here so the event taxonomy stays consistent.
 */

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

export const isAnalyticsEnabled = (): boolean => Boolean(GA_MEASUREMENT_ID);

/**
 * Canonical event names. Keep all event-name strings in one place so a typo
 * in one component doesn't silently fork the funnel.
 */
export const ANALYTICS_EVENTS = {
  // Pageviews + engagement
  PAGE_VIEW: "page_view",
  SCROLL_DEPTH: "scroll_depth",
  WEB_VITALS: "web_vitals",

  // Clicks
  CTA_CLICK: "cta_click",
  OUTBOUND_CLICK: "outbound_click",
  INTERNAL_LINK_CLICK: "internal_link_click",

  // Sign-up funnel (clicks toward app.mrprops.io)
  SIGN_UP_CLICK: "sign_up_click",

  // Lead generation (GA4 recommended)
  GENERATE_LEAD: "generate_lead",

  // Newsletter
  NEWSLETTER_SUBSCRIBE_ATTEMPT: "newsletter_subscribe_attempt",
  NEWSLETTER_SUBSCRIBE_SUCCESS: "newsletter_subscribe_success",
  NEWSLETTER_SUBSCRIBE_ERROR: "newsletter_subscribe_error",

  // Templates / lead-gen downloads (GA4 recommended `file_download`)
  TEMPLATE_DOWNLOAD_ATTEMPT: "template_download_attempt",
  TEMPLATE_DOWNLOAD_SUCCESS: "template_download_success",
  FILE_DOWNLOAD: "file_download",

  // Calculators / tools
  CALCULATOR_VIEW: "calculator_view",
  CALCULATOR_RESULT_VIEW: "calculator_result_view",
  CALCULATOR_REPORT_REQUEST: "calculator_report_request",
  CALCULATOR_REPORT_SUBMIT: "calculator_report_submit",

  // Pricing
  PRICING_SLIDER_CHANGE: "pricing_slider_change",
  PRICING_PLAN_CLICK: "pricing_plan_click",
  SELECT_ITEM: "select_item",

  // Contact / generic forms
  CONTACT_FORM_SUBMIT: "contact_form_submit",
  FORM_START: "form_start",
  FORM_SUBMIT: "form_submit",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/* eslint-disable @typescript-eslint/no-explicit-any */
type GtagCommand =
  | "config"
  | "set"
  | "event"
  | "js"
  | "consent"
  | "get"
  | "policy";

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (command: GtagCommand, ...args: any[]) => void;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Safe wrapper around `window.gtag`. No-ops on the server, when GA is
 * disabled, or when the gtag function has not yet loaded.
 */
function callGtag(
  command: GtagCommand,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
): void {
  if (typeof window === "undefined") return;
  if (!isAnalyticsEnabled()) return;
  if (typeof window.gtag !== "function") {
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push([command, ...args]);
    }
    return;
  }
  window.gtag(command, ...args);
}

export function trackPageview(url: string, title?: string): void {
  if (!isAnalyticsEnabled()) return;
  callGtag("event", ANALYTICS_EVENTS.PAGE_VIEW, {
    page_path: url,
    page_location:
      typeof window !== "undefined" ? window.location.href : undefined,
    page_title: title,
  });
}

export function trackEvent(
  name: AnalyticsEventName | string,
  params?: Record<string, unknown>,
): void {
  if (!isAnalyticsEnabled()) return;
  callGtag("event", name, params);
}

/* ------------------------------------------------------------------ */
/* CTAs and link clicks                                                */
/* ------------------------------------------------------------------ */

export interface CtaClickParams {
  cta_id: string;
  cta_label: string;
  cta_location?: string;
  cta_destination?: string;
  cta_variant?: string;
}

export function trackCtaClick(params: CtaClickParams): void {
  trackEvent(ANALYTICS_EVENTS.CTA_CLICK, params as unknown as Record<string, unknown>);
  if (
    params.cta_destination &&
    /app\.mrprops\.io\/(register|signup|trial|start)/i.test(
      params.cta_destination,
    )
  ) {
    trackEvent(ANALYTICS_EVENTS.SIGN_UP_CLICK, {
      method: "cta",
      cta_id: params.cta_id,
      cta_location: params.cta_location,
    });
  }
}

export interface OutboundClickParams {
  outbound_url: string;
  outbound_domain?: string;
  link_text?: string;
}

export function trackOutboundClick(params: OutboundClickParams): void {
  let domain = params.outbound_domain;
  if (!domain) {
    try {
      domain = new URL(params.outbound_url).hostname;
    } catch {
      domain = undefined;
    }
  }
  trackEvent(ANALYTICS_EVENTS.OUTBOUND_CLICK, {
    ...params,
    outbound_domain: domain,
  });
}

/* ------------------------------------------------------------------ */
/* Newsletter                                                          */
/* ------------------------------------------------------------------ */

export interface NewsletterEventParams {
  source: string;
  source_url?: string;
}

export function trackNewsletterAttempt(p: NewsletterEventParams): void {
  trackEvent(ANALYTICS_EVENTS.NEWSLETTER_SUBSCRIBE_ATTEMPT, {
    ...p,
    form_id: `newsletter_${p.source}`,
  });
}

export function trackNewsletterSuccess(
  p: NewsletterEventParams & { already_member?: boolean },
): void {
  trackEvent(ANALYTICS_EVENTS.NEWSLETTER_SUBSCRIBE_SUCCESS, {
    ...p,
    form_id: `newsletter_${p.source}`,
  });
  trackEvent(ANALYTICS_EVENTS.GENERATE_LEAD, {
    method: "newsletter",
    source: p.source,
    already_member: p.already_member ?? false,
    currency: "USD",
    value: 1,
  });
}

export function trackNewsletterError(
  p: NewsletterEventParams & { error_message?: string },
): void {
  trackEvent(ANALYTICS_EVENTS.NEWSLETTER_SUBSCRIBE_ERROR, {
    ...p,
    form_id: `newsletter_${p.source}`,
  });
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export interface TemplateEventParams {
  template_slug: string;
  template_category?: string;
  content_piece_id?: string | number;
  file_name?: string;
  file_extension?: string;
}

export function trackTemplateDownloadAttempt(p: TemplateEventParams): void {
  trackEvent(ANALYTICS_EVENTS.TEMPLATE_DOWNLOAD_ATTEMPT, {
    ...p,
    form_id: `template_${p.template_slug}`,
  });
}

export function trackTemplateDownloadSuccess(p: TemplateEventParams): void {
  trackEvent(ANALYTICS_EVENTS.TEMPLATE_DOWNLOAD_SUCCESS, {
    ...p,
    form_id: `template_${p.template_slug}`,
  });
  trackEvent(ANALYTICS_EVENTS.GENERATE_LEAD, {
    method: "template_download",
    template_slug: p.template_slug,
    template_category: p.template_category,
    currency: "USD",
    value: 5,
  });
  trackEvent(ANALYTICS_EVENTS.FILE_DOWNLOAD, {
    file_name: p.file_name,
    file_extension: p.file_extension,
    link_url: p.template_slug,
  });
}

/* ------------------------------------------------------------------ */
/* Calculators                                                         */
/* ------------------------------------------------------------------ */

export interface CalculatorEventParams {
  calculator_slug: string;
  calculator_category?: string;
  calculator_name?: string;
}

export function trackCalculatorView(p: CalculatorEventParams): void {
  trackEvent(ANALYTICS_EVENTS.CALCULATOR_VIEW, p as unknown as Record<string, unknown>);
}

export function trackCalculatorResultView(
  p: CalculatorEventParams & { result_summary?: string },
): void {
  trackEvent(
    ANALYTICS_EVENTS.CALCULATOR_RESULT_VIEW,
    p as unknown as Record<string, unknown>,
  );
}

export function trackCalculatorReportRequest(p: CalculatorEventParams): void {
  trackEvent(
    ANALYTICS_EVENTS.CALCULATOR_REPORT_REQUEST,
    p as unknown as Record<string, unknown>,
  );
}

export function trackCalculatorReportSubmit(p: CalculatorEventParams): void {
  trackEvent(ANALYTICS_EVENTS.CALCULATOR_REPORT_SUBMIT, {
    ...p,
    form_id: `calculator_${p.calculator_slug}`,
  });
  trackEvent(ANALYTICS_EVENTS.GENERATE_LEAD, {
    method: "calculator_report",
    calculator_slug: p.calculator_slug,
    calculator_category: p.calculator_category,
    currency: "USD",
    value: 3,
  });
}

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

export interface PricingSliderChangeParams {
  units: number;
  monthly_total: number;
  tier: string;
}

export function trackPricingSliderChange(p: PricingSliderChangeParams): void {
  trackEvent(
    ANALYTICS_EVENTS.PRICING_SLIDER_CHANGE,
    p as unknown as Record<string, unknown>,
  );
}

export interface PricingPlanClickParams extends PricingSliderChangeParams {
  source: string;
  destination?: string;
}

export function trackPricingPlanClick(p: PricingPlanClickParams): void {
  trackEvent(
    ANALYTICS_EVENTS.PRICING_PLAN_CLICK,
    p as unknown as Record<string, unknown>,
  );
  trackEvent(ANALYTICS_EVENTS.SELECT_ITEM, {
    item_list_id: "pricing_calculator",
    item_list_name: "Mr. Props Pricing",
    items: [
      {
        item_id: `tier_${p.tier}`,
        item_name: p.tier,
        item_category: "pricing_tier",
        price: p.monthly_total,
        quantity: p.units,
      },
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Contact form                                                        */
/* ------------------------------------------------------------------ */

export function trackContactFormSubmit(opts: {
  form_id?: string;
  inquiry_type?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.CONTACT_FORM_SUBMIT, {
    form_id: opts.form_id || "contact_main",
    inquiry_type: opts.inquiry_type,
  });
  trackEvent(ANALYTICS_EVENTS.GENERATE_LEAD, {
    method: "contact_form",
    form_id: opts.form_id || "contact_main",
    currency: "USD",
    value: 10,
  });
}

/* ------------------------------------------------------------------ */
/* Scroll depth + web vitals                                           */
/* ------------------------------------------------------------------ */

export function trackScrollDepth(percent: 25 | 50 | 75 | 100): void {
  trackEvent(ANALYTICS_EVENTS.SCROLL_DEPTH, {
    percent_scrolled: percent,
    page_path:
      typeof window !== "undefined" ? window.location.pathname : undefined,
  });
}

export interface WebVitalEventParams {
  name: "CLS" | "INP" | "LCP" | "FCP" | "TTFB" | string;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  navigation_type?: string;
  id?: string;
}

export function trackWebVital(p: WebVitalEventParams): void {
  trackEvent(ANALYTICS_EVENTS.WEB_VITALS, {
    metric_name: p.name,
    metric_value: Math.round(p.name === "CLS" ? p.value * 1000 : p.value),
    metric_rating: p.rating,
    navigation_type: p.navigation_type,
    metric_id: p.id,
  });
}

/* ------------------------------------------------------------------ */
/* GDPR / Consent Mode v2                                              */
/* ------------------------------------------------------------------ */

export function grantAnalyticsConsent(): void {
  callGtag("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
  });
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("mrprops_analytics_consent", "granted");
    } catch {
      /* non-fatal */
    }
  }
}

export function denyAnalyticsConsent(): void {
  callGtag("consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
  });
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("mrprops_analytics_consent", "denied");
    } catch {
      /* non-fatal */
    }
  }
}

export function readStoredConsent(): "granted" | "denied" | "unknown" {
  if (typeof window === "undefined") return "unknown";
  try {
    const v = window.localStorage.getItem("mrprops_analytics_consent");
    if (v === "granted" || v === "denied") return v;
    return "unknown";
  } catch {
    return "unknown";
  }
}
