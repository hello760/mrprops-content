"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

import {
  denyAnalyticsConsent,
  grantAnalyticsConsent,
  isAnalyticsEnabled,
  readStoredConsent,
} from "@/lib/analytics";

/**
 * Minimal, GDPR-compliant cookie consent banner.
 *
 * - Shows ONLY when GA is enabled and the user has not yet decided.
 * - Two equal-weight actions (Accept / Decline) — required by GDPR; "Reject"
 *   must be as easy as "Accept".
 * - Consent is persisted in `localStorage` so the banner doesn't reappear on
 *   every navigation.
 * - When the user accepts/declines we flip `gtag('consent', 'update', …)`.
 *   Under denied state, Google Consent Mode v2 still allows GA4 to send
 *   cookieless modeled pings.
 */
/**
 * useSyncExternalStore-driven SSR-safe boolean. Returns the initial
 * visibility synchronously without writing state inside useEffect — which
 * React 19's strict-mode "set-state-in-effect" rule flags as a smell.
 */
function useShouldShowBanner(): boolean {
  return useSyncExternalStore(
    // We don't actually subscribe to anything that changes after mount —
    // grant/deny re-renders are handled by the local `dismissed` state.
    () => () => {},
    () => isAnalyticsEnabled() && readStoredConsent() === "unknown",
    () => false, // SSR snapshot — banner is client-only.
  );
}

export function ConsentBanner() {
  const shouldShow = useShouldShowBanner();
  const [dismissed, setDismissed] = useState(false);
  const visible = shouldShow && !dismissed;

  if (!visible) return null;

  const accept = () => {
    grantAnalyticsConsent();
    setDismissed(true);
  };
  const decline = () => {
    denyAnalyticsConsent();
    setDismissed(true);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-2xl rounded-2xl border border-border bg-background/95 p-5 shadow-2xl backdrop-blur"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-relaxed text-muted-foreground">
          We use analytics cookies to understand how visitors use mrprops.io —
          which pages are useful, which calculators get used, where people
          drop off. No ads, ever.{" "}
          <Link
            href="/company/privacy"
            className="underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            Privacy policy
          </Link>
          .
        </p>
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={decline}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
