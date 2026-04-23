/**
 * mrprops-content middleware — serves 301/302 redirects for paths stored in
 * the Supabase `content_redirects` table. The table is the CMS-managed
 * source of truth for URL redirects; MMG Command Center writes to it when a
 * piece's custom_slug changes after publish, and Settings → Redirects in the
 * admin UI lets operators add/edit/delete rows directly.
 *
 * Runtime: Edge (Next.js middleware default). Uses `fetch` to hit PostgREST
 * so it works in the Edge runtime — no supabase-js import.
 *
 * Caching: 60-second in-memory cache per Edge isolate. New redirects
 * propagate in ≤60s. Cache is keyed per-request path so a cache-miss hits
 * PostgREST for a single row, not the whole table.
 *
 * Static `next.config.ts` redirects (there are ~12 legacy ones) continue to
 * apply BEFORE this middleware because Next.js config redirects run first.
 * This middleware is purely additive.
 */

import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const CLIENT_ID = 'client-mrprops';
const CACHE_TTL_MS = 60_000;

interface RedirectRow {
  to_path: string;
  status_code: number;
}

// Module-level cache — survives across requests in a single Edge isolate.
// Value = { row, fetchedAt } or null (negative-cached miss).
type CacheEntry = { row: RedirectRow | null; fetchedAt: number };
const cache = new Map<string, CacheEntry>();

/**
 * Fetch a single redirect row for the given incoming path. Returns null if
 * not found or on any error (fail-open — do not break the site for a
 * redirect lookup failure).
 */
async function fetchRedirect(pathname: string): Promise<RedirectRow | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/content_redirects`);
    url.searchParams.set('client_id', `eq.${CLIENT_ID}`);
    url.searchParams.set('from_path', `eq.${pathname}`);
    url.searchParams.set('is_active', 'eq.true');
    url.searchParams.set('select', 'to_path,status_code');
    url.searchParams.set('limit', '1');
    const res = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      // Edge fetch cache — don't cache at the platform layer; we have our own.
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as RedirectRow[];
    return rows[0] || null;
  } catch {
    return null;
  }
}

/** Resolve a redirect for a path, using the in-memory cache. */
async function resolveRedirect(pathname: string): Promise<RedirectRow | null> {
  const cached = cache.get(pathname);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.row;
  }
  const row = await fetchRedirect(pathname);
  cache.set(pathname, { row, fetchedAt: now });
  return row;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Fast-skip: static assets, API routes, internal Next.js paths.
  // Matcher below already excludes most of these but the guard keeps the
  // fetch cost zero for anything that leaks through.
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/draft/') || // draft-preview route is always passthrough
    /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|map|xml|txt|woff2?|ttf|eot)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const redirect = await resolveRedirect(pathname);
  if (redirect && redirect.to_path && redirect.to_path !== pathname) {
    const target = new URL(redirect.to_path, req.nextUrl.origin);
    return NextResponse.redirect(target, redirect.status_code || 301);
  }
  return NextResponse.next();
}

// Run on every non-static request; specific exclusions handled inside.
export const config = {
  matcher: [
    // Match all paths except Next internals + static assets. The function
    // itself does finer-grained skipping; this matcher just reduces invocations.
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
