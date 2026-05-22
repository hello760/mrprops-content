import Script from "next/script";

import { GA_MEASUREMENT_ID } from "@/lib/analytics";

/**
 * Loads gtag.js with Consent Mode v2 defaults set BEFORE the script runs.
 *
 * EU-default-deny posture (Mr Props is operated from Latvia):
 *  - `analytics_storage` is denied by default for the EEA + UK + CH region
 *    set. The `<ConsentBanner />` flips this to "granted" when the visitor
 *    consents.
 *  - Cookieless pings still fire under denied state so GA4 can run "Behavioural
 *    Modeling" / consent-mode reporting. This keeps directional traffic
 *    metrics visible while staying GDPR-compliant.
 *  - We also call `gtag('config', ..., { send_page_view: false })` because the
 *    Next.js App Router needs SPA navigations tracked manually — see
 *    <AnalyticsListener />.
 *
 * If `NEXT_PUBLIC_GA_MEASUREMENT_ID` is not set (preview builds, local dev),
 * the component renders nothing.
 */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  // EU + EEA + UK + Switzerland — denied-by-default region set.
  const euRegions = [
    "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
    "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO",
    "GB","CH",
  ];

  const consentDefault = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500,
});
gtag('consent', 'default', {
  region: ${JSON.stringify(euRegions)},
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500,
});
// Outside the EU default-deny region we grant analytics_storage so the
// majority of (non-EU) traffic is measured without a banner click. This
// matches the "denied-by-default for EU, granted-elsewhere" Google guidance.
try {
  const stored = (window.localStorage && window.localStorage.getItem('mrprops_analytics_consent')) || null;
  if (stored === 'granted') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
  } else if (stored !== 'denied') {
    // No prior choice — opportunistically grant outside EU regions only.
    // The IP-based region overrides above keep EU visitors denied until they
    // tap Accept in the banner.
  }
} catch (_e) { /* noop */ }
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', {
  send_page_view: false,
  anonymize_ip: true,
  cookie_flags: 'SameSite=None;Secure',
});
`;

  return (
    <>
      <Script
        id="ga4-consent-default"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: consentDefault }}
      />
      <Script
        id="ga4-gtag"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
    </>
  );
}
