# Analytics — Mr Props Website (mrprops.io)

Google Analytics 4 implementation for the Next.js content site. Designed
around CRO best practices: every meaningful click, form interaction, and
funnel transition emits a typed event you can build reports against.

## Files

| File | Role |
| --- | --- |
| `src/lib/analytics.ts` | Public surface — `track*` helpers + the canonical event-name enum. Page code calls these, never `window.gtag` directly. |
| `src/components/analytics/GoogleAnalytics.tsx` | Loads `gtag.js` with Consent Mode v2 defaults (EU-default-deny). |
| `src/components/analytics/AnalyticsListener.tsx` | Fires `page_view` on every App Router client navigation (gtag's auto-page-view is disabled). |
| `src/components/analytics/AnalyticsTracker.tsx` | Global delegated listeners — scroll depth, outbound clicks, CTA clicks via `data-analytics-cta`, web vitals. |
| `src/components/analytics/ConsentBanner.tsx` | Minimal GDPR consent banner. Flips `gtag('consent','update', …)`. |

## Setup — Vercel env vars

Add to **Vercel → Project: `mrprops-content` → Settings → Environment Variables**:

```
NEXT_PUBLIC_GA_MEASUREMENT_ID = G-WEBEM9Z3BP
```

The variable is `NEXT_PUBLIC_*` because gtag.js runs in the browser. Until
the variable is set, every `track*` helper is a no-op — Preview deployments
won't pollute the production property.

## CTA tracking — declarative

Any clickable element with `data-analytics-cta` is auto-tracked by
`AnalyticsTracker`. Convention:

```tsx
<a
  href="https://app.mrprops.io/register"
  data-analytics-cta="header_try_free"
  data-analytics-cta-label="Try Free"
  data-analytics-cta-location="header"
  data-analytics-cta-destination="https://app.mrprops.io/register"
>
  Try Free
</a>
```

When the destination points at `app.mrprops.io/register` the helper also
fires a `sign_up_click` event so the activation funnel works out of the box.

## Event taxonomy

| Event | Trigger | Key params |
| --- | --- | --- |
| `page_view` | App Router navigation | `page_path`, `page_location`, `page_title` |
| `scroll_depth` | 25/50/75/100% page scroll | `percent_scrolled`, `page_path` |
| `web_vitals` | LCP / CLS / INP on page hide | `metric_name`, `metric_value`, `metric_rating` |
| `cta_click` | Element with `data-analytics-cta` | `cta_id`, `cta_label`, `cta_location`, `cta_destination` |
| `outbound_click` | `<a>` to a different hostname | `outbound_url`, `outbound_domain` |
| `sign_up_click` | CTA whose destination is `app.mrprops.io/register` | `method`, `cta_id`, `cta_location` |
| `newsletter_subscribe_attempt` | Footer + inline newsletter form submit | `source`, `source_url` |
| `newsletter_subscribe_success` | API 200 from `/api/newsletter/subscribe` | `source`, `already_member` |
| `newsletter_subscribe_error` | API error or network fail | `source`, `error_message` |
| `template_download_attempt` | LeadGenTemplateClient form submit | `template_slug`, `template_category` |
| `template_download_success` | File download triggered | `template_slug`, `file_name`, `file_extension` |
| `file_download` | (GA4 recommended) downloads | `file_name`, `file_extension`, `link_url` |
| `calculator_view` | CalculatorLayout mounted | `calculator_slug`, `calculator_category` |
| `calculator_result_view` | results panel rendered | `calculator_slug` |
| `calculator_report_request` | "Email me the report" modal opened | `calculator_slug` |
| `calculator_report_submit` | Modal email submit | `calculator_slug`, `form_id` |
| `pricing_slider_change` | Pricing range slider settles (500ms debounce) | `units`, `monthly_total`, `tier` |
| `pricing_plan_click` | Click on a tier card or bottom CTA | `units`, `monthly_total`, `tier`, `source` |
| `select_item` | (GA4 recommended) tier card click | `item_list_id`, `items[]` |
| `contact_form_submit` | `/company/contact` submit | `form_id`, `inquiry_type` |
| `form_start` | First focus inside contact form | `form_id` |
| `generate_lead` | Newsletter / template / contact / calculator-report success | `method`, `currency`, `value` |

All event params land in the GA4 DebugView immediately if `?debug_mode=true`
is appended to any URL. (Recommended for QA after deploy.)

## GA4 admin checklist — do these in the Google Analytics UI

Open https://analytics.google.com → Property `mrprops.io` (`G-WEBEM9Z3BP`)
→ **Admin** (bottom-left gear icon).

### 1. Mark conversions ("Key Events")
**Admin → Events → Mark as key event** (toggle the switch):

- ✅ `generate_lead` (any newsletter / template / contact / calculator submit)
- ✅ `sign_up_click` (clicks toward app.mrprops.io/register)
- ✅ `calculator_report_submit`
- ✅ `template_download_success`
- ✅ `contact_form_submit`

(`page_view` and `scroll_depth` are engagement signals, not conversions.)

### 2. Custom dimensions — register the params we send
**Admin → Custom definitions → Custom dimensions → Create**. Add:

| Dimension name | Event parameter | Scope |
| --- | --- | --- |
| CTA ID | `cta_id` | Event |
| CTA Location | `cta_location` | Event |
| CTA Destination | `cta_destination` | Event |
| Source | `source` | Event |
| Form ID | `form_id` | Event |
| Method | `method` | Event |
| Calculator Slug | `calculator_slug` | Event |
| Calculator Category | `calculator_category` | Event |
| Template Slug | `template_slug` | Event |
| Template Category | `template_category` | Event |
| Pricing Tier | `tier` | Event |
| Pricing Units | `units` | Event |
| Outbound Domain | `outbound_domain` | Event |
| Scroll % | `percent_scrolled` | Event |
| Web Vital Name | `metric_name` | Event |
| Web Vital Rating | `metric_rating` | Event |

Without registering these, GA4 will record them but you can't slice or
filter in standard reports.

### 3. Custom metrics
**Admin → Custom definitions → Custom metrics → Create**:

| Metric name | Event parameter | Unit |
| --- | --- | --- |
| Web Vital Value | `metric_value` | Standard |
| Monthly Total (USD) | `monthly_total` | Currency |

### 4. Data retention
**Admin → Data Settings → Data Retention** → bump from 2 months to **14 months**.
(Default 2-month cap kills cohort analysis on first repeat traffic.)

### 5. Internal traffic filter
**Admin → Data Streams → Web stream (mrprops.io) → Configure tag settings →
Show all → Define internal traffic.** Add Helvis's IP(s) as `internal`.
Then **Admin → Data Settings → Data Filters → Active** the `internal`
filter (default: testing — flip to Active).

### 6. Cross-domain measurement
**Admin → Data Streams → Web → Configure tag settings → Configure your
domains** → add `app.mrprops.io` so a click from `mrprops.io` → `app.mrprops.io`
keeps the same session/client ID. Crucial for measuring sign-up activation.

### 7. Recommended audiences
**Admin → Audiences → New audience**:

- *Engaged Visitors* — `session_duration > 60s` OR `scroll_depth ≥ 75`
- *Pricing Page Visitors* — pageview where `page_path` contains `/pricing`
- *Calculator Users* — anyone who fired `calculator_result_view`
- *Lead Funnel Bottom* — anyone who fired `generate_lead`
- *Sign-up Intent* — anyone who fired `sign_up_click`

### 8. Explorations to set up first
**Reports → Explore → New blank exploration**:

1. **Funnel: Visit → Calculator → Lead → Sign-up Click**
   Steps: `page_view` → `calculator_view` → `generate_lead` → `sign_up_click`.
2. **Path: Landing → Conversion**
   Starting node = `page_view` on landing pages.
3. **Free form by `cta_location`**
   Rows: `cta_location`, Columns: device category, Values: `Event count` of `cta_click` + Conversion rate.
4. **Scroll depth heatmap by page**
   Rows: `page_path`, Columns: `percent_scrolled`, Values: `Event count`.

### 9. Connect Search Console
**Admin → Product links → Search Console links → Link** the GSC property
for `mrprops.io`. Adds the "Search Console" report family.

### 10. Consent Mode v2 — confirm it's working
GA4 has a built-in **Admin → Data Settings → Consent Mode** report.
Should show "Active — receiving denied + granted signals" within 24h after
release. If it shows zero denied pings, the EU default-deny posture isn't
firing.

## Local debugging

```bash
# Enable GA4 DebugView for a single browser session:
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-WEBEM9Z3BP npm run dev
# Then open http://localhost:3000/?debug_mode=true
# Events show up at analytics.google.com → Admin → DebugView.
```

To temporarily disable analytics in production (incident response):
delete the `NEXT_PUBLIC_GA_MEASUREMENT_ID` env var in Vercel and redeploy.
All `track*` helpers become no-ops; the gtag script stops loading.
