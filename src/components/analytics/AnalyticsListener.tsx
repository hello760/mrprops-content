"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { trackPageview } from "@/lib/analytics";

/**
 * SPA-pageview emitter for the Next.js App Router.
 *
 * Why: when `<GoogleAnalytics />` configures gtag with `send_page_view:false`
 * (so we own pageviews), gtag.js will NOT auto-fire on client-side
 * navigation either. This listener watches the App Router's pathname +
 * searchParams and dispatches `page_view` manually whenever they change.
 *
 * Mount once near the top of `app/layout.tsx`.
 *
 * `usePathname()` and `usePathname()` both require a Suspense boundary in
 * Next.js 15+ when used in a layout that is statically rendered. We
 * encapsulate the inner hook in <Inner /> and wrap in <Suspense /> so the
 * layout still streams.
 */
function PageviewInner() {
  const pathname = usePathname();
  const search = useSearchParams();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const queryString = search?.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    if (lastSent.current === url) return;
    lastSent.current = url;
    trackPageview(
      url,
      typeof document !== "undefined" ? document.title : undefined,
    );
  }, [pathname, search]);

  return null;
}

export function AnalyticsListener() {
  return (
    <Suspense fallback={null}>
      <PageviewInner />
    </Suspense>
  );
}
