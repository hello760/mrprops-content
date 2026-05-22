"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import {
  trackCtaClick,
  trackOutboundClick,
  trackScrollDepth,
  trackWebVital,
} from "@/lib/analytics";

/**
 * Global, mount-once auto-trackers that don't require per-page wiring.
 *
 * 1) Scroll-depth — fires `scroll_depth` events at 25/50/75/100 % of the
 *    document height, ONCE per pathname.
 * 2) Outbound clicks — captures any `<a>` whose hostname is not the current
 *    host. Skips downloads (those are tracked via the file_download path).
 * 3) CTA clicks — captures any element with the `[data-analytics-cta]`
 *    attribute. Convention:
 *       <a data-analytics-cta="header_try_free"
 *          data-analytics-cta-location="header"
 *          data-analytics-cta-label="Try Free"
 *          ...>
 *    `id` + label + location + destination are forwarded to GA4. If location
 *    or label aren't set we infer from `textContent` and the element's
 *    nearest <section> id.
 * 4) Web vitals — uses Next.js `web-vitals` integration via the Performance
 *    API on browsers that support it (PerformanceObserver for LCP/CLS/INP).
 *
 * Mount once near the top of `app/layout.tsx` alongside <AnalyticsListener />.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const firedRef = useRef<Record<number, boolean>>({});

  // Reset scroll-depth tracking on pathname change.
  useEffect(() => {
    firedRef.current = {};
  }, [pathname]);

  // Scroll depth listener.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const computeAndDispatch = () => {
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      const viewport = window.innerHeight;
      const total = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      );
      if (total <= viewport) return;
      const percent = Math.min(
        100,
        Math.round(((scrollTop + viewport) / total) * 100),
      );
      ([25, 50, 75, 100] as const).forEach((threshold) => {
        if (percent >= threshold && !firedRef.current[threshold]) {
          firedRef.current[threshold] = true;
          trackScrollDepth(threshold);
        }
      });
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        computeAndDispatch();
        ticking = false;
      });
    };
    // Fire once on mount to catch tall pages that load already scrolled.
    computeAndDispatch();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // Outbound + CTA click listener (single delegated handler).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a, button, [data-analytics-cta]") as
        | HTMLElement
        | null;
      if (!anchor) return;

      // CTA tracking via data attribute — fires for buttons + links.
      const ctaId = anchor.getAttribute("data-analytics-cta");
      if (ctaId) {
        const label =
          anchor.getAttribute("data-analytics-cta-label") ||
          anchor.getAttribute("aria-label") ||
          (anchor.textContent || "").trim().slice(0, 80);
        const location =
          anchor.getAttribute("data-analytics-cta-location") ||
          findSectionId(anchor) ||
          undefined;
        const destination =
          anchor.getAttribute("data-analytics-cta-destination") ||
          (anchor as HTMLAnchorElement).href ||
          undefined;
        const variant =
          anchor.getAttribute("data-analytics-cta-variant") || undefined;
        trackCtaClick({
          cta_id: ctaId,
          cta_label: label,
          cta_location: location,
          cta_destination: destination,
          cta_variant: variant,
        });
      }

      // Outbound link detection — only true <a> with absolute external href.
      if (anchor.tagName === "A") {
        const a = anchor as HTMLAnchorElement;
        const href = a.getAttribute("href") || "";
        if (!href || href.startsWith("#") || href.startsWith("/") ||
            href.startsWith("mailto:") || href.startsWith("tel:") ||
            href.startsWith("javascript:")) {
          return;
        }
        let url: URL | null = null;
        try {
          url = new URL(a.href);
        } catch {
          url = null;
        }
        if (!url) return;
        if (url.hostname === window.location.hostname) return;
        // Skip if this is also a file_download — `trackTemplateDownloadSuccess`
        // handles those.
        if (
          a.hasAttribute("download") ||
          /\.(pdf|csv|xlsx?|docx?|zip)(\?|$)/i.test(url.pathname)
        ) {
          return;
        }
        trackOutboundClick({
          outbound_url: url.href,
          outbound_domain: url.hostname,
          link_text: (a.textContent || "").trim().slice(0, 80),
        });
      }
    };

    document.addEventListener("click", handler, { capture: true });
    return () =>
      document.removeEventListener("click", handler, { capture: true });
  }, []);

  // Web vitals via PerformanceObserver (LCP / CLS / INP / FCP / TTFB).
  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }
    const cleanups: Array<() => void> = [];

    // LCP — largest-contentful-paint, take the latest entry on page hide.
    try {
      let lastLcp = 0;
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length === 0) return;
        const last = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number;
          startTime: number;
        };
        lastLcp = last.renderTime || last.startTime || 0;
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      const flushLcp = () => {
        if (lastLcp > 0) {
          trackWebVital({
            name: "LCP",
            value: lastLcp,
            rating:
              lastLcp <= 2500
                ? "good"
                : lastLcp <= 4000
                  ? "needs-improvement"
                  : "poor",
          });
          lastLcp = 0;
        }
      };
      addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") flushLcp();
      });
      addEventListener("pagehide", flushLcp);
      cleanups.push(() => lcpObserver.disconnect());
    } catch {
      /* unsupported entry type */
    }

    // CLS — layout-shift cumulative score.
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<
          PerformanceEntry & { value: number; hadRecentInput: boolean }
        >) {
          if (!entry.hadRecentInput) clsValue += entry.value;
        }
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
      const flushCls = () => {
        if (clsValue > 0) {
          trackWebVital({
            name: "CLS",
            value: clsValue,
            rating:
              clsValue <= 0.1
                ? "good"
                : clsValue <= 0.25
                  ? "needs-improvement"
                  : "poor",
          });
          clsValue = 0;
        }
      };
      addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") flushCls();
      });
      addEventListener("pagehide", flushCls);
      cleanups.push(() => clsObserver.disconnect());
    } catch {
      /* noop */
    }

    // INP — approximate via 'event' entries (interactionId-bearing).
    try {
      let maxDuration = 0;
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<
          PerformanceEntry & {
            duration: number;
            interactionId?: number;
          }
        >) {
          if ((entry.interactionId || 0) > 0 && entry.duration > maxDuration) {
            maxDuration = entry.duration;
          }
        }
      });
      inpObserver.observe({
        type: "event",
        buffered: true,
        // @ts-expect-error: durationThreshold is a Chrome-specific extension
        durationThreshold: 40,
      });
      const flushInp = () => {
        if (maxDuration > 0) {
          trackWebVital({
            name: "INP",
            value: maxDuration,
            rating:
              maxDuration <= 200
                ? "good"
                : maxDuration <= 500
                  ? "needs-improvement"
                  : "poor",
          });
          maxDuration = 0;
        }
      };
      addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") flushInp();
      });
      addEventListener("pagehide", flushInp);
      cleanups.push(() => inpObserver.disconnect());
    } catch {
      /* event entry type unsupported */
    }

    return () => cleanups.forEach((c) => c());
  }, []);

  return null;
}

function findSectionId(el: HTMLElement | null): string | null {
  let cur: HTMLElement | null = el;
  while (cur && cur !== document.body) {
    if (cur.id) return cur.id;
    const dataLoc = cur.getAttribute?.("data-analytics-cta-location");
    if (dataLoc) return dataLoc;
    if (cur.tagName === "SECTION" || cur.tagName === "HEADER" ||
        cur.tagName === "FOOTER" || cur.tagName === "NAV") {
      return cur.tagName.toLowerCase();
    }
    cur = cur.parentElement;
  }
  return null;
}
