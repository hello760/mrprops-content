import Script from "next/script";

import { GA_MEASUREMENT_ID } from "@/lib/analytics";

/**
 * Loads Google Tag Manager (GTM-XXXXXXX) with Consent Mode v2 defaults set
 * BEFORE GTM boots. GA4 (`G-WEBEM9Z3BP`) is configured INSIDE GTM as a
 * "Google tag" — there is no separate gtag.js script on the page, so only
 * ONE network request hits *.googletagmanager.com (the GTM container).
 *
 * Why this shape:
 *   - All our `trackEvent` calls write to `window.dataLayer` via the
 *     `gtag()` shim defined below. GTM listens to dataLayer and forwards
 *     events to GA4 automatically through the in-GTM Google tag.
 *   - EU-default-deny posture (Mr Props is operated from Latvia): GTM
 *     Consent Mode v2 defaults block `analytics_storage` for EEA + UK + CH
 *     until the visitor accepts via <ConsentBanner />. Outside EU we keep
 *     defaults at denied to be conservative; the banner grants on opt-in.
 *   - When `NEXT_PUBLIC_GTM_CONTAINER_ID` is unset (preview / dev), the
 *     component renders nothing so previews don't pollute the property.
 *
 * The `<noscript>` iframe pair lives in `app/layout.tsx` so it can be a
 * direct child of `<body>`.
 */
export function GoogleAnalytics() {
  const containerId = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;
  if (!containerId) return null;

  // EU + EEA + UK + Switzerland — denied-by-default region set.
  const euRegions = [
    "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
    "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO",
    "GB","CH",
  ];

  // Consent defaults — set BEFORE GTM loads so GTM picks them up.
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
try {
  var stored = (window.localStorage && window.localStorage.getItem('mrprops_analytics_consent')) || null;
  if (stored === 'granted') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
  }
} catch (_e) { /* localStorage blocked — fall back to denied default */ }
gtag('js', new Date());
`;

  // GTM snippet (the head half of the standard install). We split it from
  // the snippet GTM gives in the UI because next/script handles async load.
  const gtmBootstrap = `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');
`;

  return (
    <>
      <Script
        id="gtm-consent-default"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: consentDefault }}
      />
      <Script
        id="gtm-bootstrap"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: gtmBootstrap }}
      />
    </>
  );
}

/**
 * <noscript> fallback iframe — must be a direct child of <body>. Imported
 * separately in app/layout.tsx because Script can't render server-side
 * <noscript> tags.
 */
export function GoogleTagManagerNoScript() {
  const containerId = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;
  if (!containerId) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}

/**
 * Backward-compat: re-export the GA measurement ID constant so any module
 * that needs to detect "is analytics on" can still rely on it.
 */
export { GA_MEASUREMENT_ID };
